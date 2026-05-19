// Edge Function: zr-sync-territories
// Synchronise les UUIDs des communes ZR et un hub par defaut par wilaya
// Admin uniquement
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZR_BASE = "https://api.zrexpress.app/api/v1";

function zrHeaders(tenantId: string, secretKey: string) {
  return {
    "X-Tenant": tenantId,
    "X-Api-Key": secretKey,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await sb.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = (claims?.claims as any)?.sub;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tenantId = Deno.env.get("ZR_TENANT_ID")!;
    const secretKey = Deno.env.get("ZR_SECRET_KEY")!;
    const headers = zrHeaders(tenantId, secretKey);

    // 1) Recuperer toutes les communes
    const allCommunes: any[] = [];
    let page = 1;
    while (true) {
      const r = await fetch(`${ZR_BASE}/territories/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({ pageNumber: page, pageSize: 500, level: "commune" }),
      });
      if (!r.ok) throw new Error(`territories ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const j = await r.json();
      allCommunes.push(...(j.items || []));
      if (!j.hasNext) break;
      page++;
      if (page > 50) break;
    }

    // 2) Recuperer tous les hubs
    const allHubs: any[] = [];
    page = 1;
    while (true) {
      const r = await fetch(`${ZR_BASE}/hubs/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({ pageNumber: page, pageSize: 200 }),
      });
      if (!r.ok) throw new Error(`hubs ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const j = await r.json();
      allHubs.push(...(j.items || []));
      if (!j.hasNext) break;
      page++;
      if (page > 20) break;
    }

    // 3) Charger nos wilayas et communes
    const { data: zones } = await admin.from("delivery_zones").select("code,name");
    const { data: communes } = await admin.from("delivery_communes").select("id,wilaya_code,name");

    // Map wilaya UUID ZR (parentId des communes) -> code wilaya local
    // On utilise les noms des communes pour deduire la wilaya
    const zoneByName = new Map<string, { code: string; name: string }>();
    (zones || []).forEach((z: any) => zoneByName.set(norm(z.name), z));

    // 4) Mise a jour des communes : matcher par (wilaya_code, name)
    const zrCommunesByWilayaUuid = new Map<string, any[]>();
    for (const c of allCommunes) {
      const arr = zrCommunesByWilayaUuid.get(c.parentId) || [];
      arr.push(c);
      zrCommunesByWilayaUuid.set(c.parentId, arr);
    }

    // Construire wilayaUuid -> code local en regardant le hub correspondant
    const wilayaUuidToCode = new Map<string, string>();
    const wilayaUuidToDistrictId = new Map<string, string>();
    const wilayaCodeToHubId = new Map<string, string>();
    for (const h of allHubs) {
      const cityUuid = h.address?.cityTerritoryId;
      const districtUuid = h.address?.districtTerritoryId;
      const cityName = h.address?.city || "";
      const z = zoneByName.get(norm(cityName));
      if (z && cityUuid) {
        wilayaUuidToCode.set(cityUuid, z.code);
        if (districtUuid) wilayaUuidToDistrictId.set(cityUuid, districtUuid);
        if (!wilayaCodeToHubId.has(z.code) && h.isPickupPoint) wilayaCodeToHubId.set(z.code, h.id);
      }
    }

    // Mettre a jour delivery_zones avec hub par defaut
    let zonesUpdated = 0;
    for (const [code, hubId] of wilayaCodeToHubId) {
      const districtId = [...wilayaUuidToDistrictId.entries()].find(([uuid]) => wilayaUuidToCode.get(uuid) === code)?.[1];
      const { error } = await admin.from("delivery_zones").update({
        zr_hub_id: hubId,
        zr_district_id: districtId || null,
      }).eq("code", code);
      if (!error) zonesUpdated++;
    }

    // Matcher communes
    let communesUpdated = 0;
    const updates: { id: string; zr: string }[] = [];
    for (const c of (communes || [])) {
      // trouver wilaya uuid
      const wilayaUuid = [...wilayaUuidToCode.entries()].find(([_, code]) => code === c.wilaya_code)?.[0];
      if (!wilayaUuid) continue;
      const list = zrCommunesByWilayaUuid.get(wilayaUuid) || [];
      const target = norm(c.name);
      const match = list.find((x: any) => norm(x.name) === target)
        || list.find((x: any) => norm(x.name).includes(target) || target.includes(norm(x.name)));
      if (match) updates.push({ id: c.id, zr: match.id });
    }
    // batch update
    for (const u of updates) {
      const { error } = await admin.from("delivery_communes").update({ zr_territory_id: u.zr }).eq("id", u.id);
      if (!error) communesUpdated++;
    }

    return new Response(JSON.stringify({
      ok: true,
      zr_communes_fetched: allCommunes.length,
      zr_hubs_fetched: allHubs.length,
      delivery_zones_updated: zonesUpdated,
      delivery_communes_updated: communesUpdated,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("zr-sync-territories error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
