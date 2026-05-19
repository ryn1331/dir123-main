// Edge Function: create-shipment
// Cree l'expedition dans Yalidine ou ZR Express quand l'admin confirme la commande
// AUTH requise (admin connecte)
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const YALIDINE_BASE = "https://api.yalidine.app/v1";
const ZR_BASE = "https://api.zrexpress.app/api/v1";

const ZR_LEGACY_FALLBACK_BY_CODE: Record<string, string> = {
  "33": "30", // Illizi -> Ouargla (extreme sud-est sans hub direct)
  "37": "08", // Tindouf -> Bechar
  "49": "39", // El M'Ghair -> El Oued
  "50": "47", // El Meniaa -> Ghardaia
  "52": "01", // Bordj Badji Mokhtar -> Adrar
  "53": "08", // Beni Abbes -> Bechar
  "54": "01", // Timimoun -> Adrar
  "56": "30", // Djanet -> Ouargla (Illizi vide)
  "57": "11", // In Salah -> Tamanrasset
  "58": "11", // In Guezzam -> Tamanrasset
};

class ShipmentError extends Error {
  status: number;
  fallback: boolean;

  constructor(message: string, status = 200, fallback = true) {
    super(message);
    this.status = status;
    this.fallback = fallback;
  }
}

function zrHeaders(tenantId: string, secretKey: string) {
  return {
    "X-Tenant": tenantId,
    "X-Api-Key": secretKey,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

function normName(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

async function findZrFallbackTerritory(admin: any, wilayaCode: string, communeName: string) {
  const linkedCols = "name,zr_territory_id,zr_district_id,wilaya_code";
  const target = normName(communeName);

  const { data: sameWilaya } = await admin
    .from("delivery_communes")
    .select(linkedCols)
    .eq("wilaya_code", wilayaCode)
    .not("zr_territory_id", "is", null)
    .limit(200);
  const sameMatch = (sameWilaya || []).find((c: any) => normName(c.name) === target) || (sameWilaya || [])[0];
  if (sameMatch?.zr_territory_id && sameMatch?.zr_district_id) return sameMatch;

  const legacyCode = ZR_LEGACY_FALLBACK_BY_CODE[wilayaCode];
  if (legacyCode) {
    const { data: legacy } = await admin
      .from("delivery_communes")
      .select(linkedCols)
      .eq("wilaya_code", legacyCode)
      .not("zr_territory_id", "is", null)
      .limit(200);
    const legacyMatch = (legacy || []).find((c: any) => normName(c.name) === target) || (legacy || [])[0];
    if (legacyMatch?.zr_territory_id && legacyMatch?.zr_district_id) return legacyMatch;
  }

  const { data: globalMatch } = await admin
    .from("delivery_communes")
    .select(linkedCols)
    .not("zr_territory_id", "is", null)
    .limit(2000);
  const named = (globalMatch || []).find((c: any) => normName(c.name) === target);
  if (named?.zr_territory_id && named?.zr_district_id) return named;
  // Dernier recours: premier territoire ZR lie, pour ne jamais bloquer la creation.
  return (globalMatch || []).find((c: any) => c.zr_territory_id && c.zr_district_id) || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let requestOrderId: string | null = null;

  // ---- DRY RUN: validation sans appel API ZR/Yalidine ni ecriture DB ----
  // Auth: bearer = SERVICE_ROLE_KEY. Body: { dry_run:true, wilaya, commune, delivery_type }
  try {
    const cloned = req.clone();
    const peek = await cloned.json().catch(() => ({} as any));
    if (peek?.dry_run) {
      const auth = req.headers.get("Authorization") || "";
      const token = auth.replace(/^Bearer\s+/, "");
      let isServiceRole = false;
      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        isServiceRole = payload?.role === "service_role";
      } catch (_) { /* ignore */ }
      if (!isServiceRole) {
        return new Response(JSON.stringify({ error: "Unauthorized dry_run" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { wilaya, commune, delivery_type } = peek;
      const { data: zone } = await admin.from("delivery_zones")
        .select("code,name,zr_hub_id,zr_district_id,has_zr_express,has_yalidine")
        .eq("name", wilaya).maybeSingle();
      if (!zone) {
        return new Response(JSON.stringify({ ok: false, error: `wilaya "${wilaya}" introuvable` }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Resolution ZR
      const { data: communeRow } = await admin.from("delivery_communes")
        .select("zr_territory_id,zr_district_id,name")
        .eq("wilaya_code", zone.code).ilike("name", commune).maybeSingle();
      let cityTerritoryId = communeRow?.zr_territory_id;
      let districtTerritoryId = communeRow?.zr_district_id || zone.zr_district_id;
      let resolvedVia = communeRow?.zr_territory_id ? "direct" : "";
      let effectiveService = delivery_type === "bureau" ? "zr_bureau" : "zr_domicile";
      if (!cityTerritoryId || !districtTerritoryId) {
        const fb = await findZrFallbackTerritory(admin, zone.code, commune);
        if (fb?.zr_territory_id && fb?.zr_district_id) {
          cityTerritoryId = fb.zr_territory_id;
          districtTerritoryId = fb.zr_district_id;
          effectiveService = "zr_domicile";
          resolvedVia = `fallback(${fb.wilaya_code})`;
        }
      }
      if (!cityTerritoryId || !districtTerritoryId) {
        return new Response(JSON.stringify({
          ok: false, error: `commune "${commune}" non resoluble`, zone: zone.code,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      let deliveryType: "pickup-point" | "home" = delivery_type === "bureau" ? "pickup-point" : "home";
      if (deliveryType === "pickup-point" && (!zone.zr_hub_id || effectiveService === "zr_domicile")) {
        deliveryType = "home";
        effectiveService = "zr_domicile";
      }
      return new Response(JSON.stringify({
        ok: true,
        dry_run: true,
        wilaya: zone.name,
        wilaya_code: zone.code,
        commune,
        resolvedVia,
        effectiveService,
        deliveryType,
        cityTerritoryId,
        districtTerritoryId,
        hubId: deliveryType === "pickup-point" ? zone.zr_hub_id : null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("dry_run error:", e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Auth: admin uniquement
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    // Verify admin role
    const adminCheck = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleRow } = await adminCheck
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { order_id } = body;
    requestOrderId = order_id || null;
    if (!order_id) throw new Error("order_id requis");

    // Service role pour lire la commande
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: order, error: oErr } = await admin.from("orders").select("*").eq("id", order_id).single();
    if (oErr || !order) throw new Error("Commande introuvable");
    if (order.tracking_number) {
      return new Response(JSON.stringify({ ok: true, tracking_number: order.tracking_number, already: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items } = await admin.from("order_items").select("*").eq("order_id", order_id);
    const productList = (items || []).map((i: any) => `${i.product_name} x${i.quantity}`).join(", ");

    const deliveryService = (order.service_livraison || "").toLowerCase();
    const isYalidine = deliveryService.startsWith("yalidine");
    let effectiveDeliveryService = deliveryService;
    let tracking = "";
    let labelUrl = "";

    if (isYalidine) {
      const apiId = Deno.env.get("YALIDINE_API_ID")!;
      const apiToken = Deno.env.get("YALIDINE_API_TOKEN")!;
      let isStopdesk = deliveryService === "yalidine_bureau";

      let stopdeskId: number | null = null;
      if (isStopdesk) {
        // Recuperer le wilaya_id depuis delivery_zones (code)
        const { data: zone } = await admin
          .from("delivery_zones").select("code").eq("name", order.wilaya).maybeSingle();
        const wilayaId = zone?.code ? parseInt(zone.code, 10) : null;
        if (!wilayaId) throw new Error(`Yalidine: wilaya "${order.wilaya}" introuvable`);

        const centersResp = await fetch(`${YALIDINE_BASE}/centers/?wilaya_id=${wilayaId}`, {
          headers: { "X-API-ID": apiId, "X-API-TOKEN": apiToken },
        });
        const centersText = await centersResp.text();
        if (!centersResp.ok) throw new Error(`Yalidine centers ${centersResp.status}: ${centersText.slice(0, 200)}`);
        const centersJson = JSON.parse(centersText);
        const centers = Array.isArray(centersJson.data) ? centersJson.data : Array.isArray(centersJson) ? centersJson : [];
        const target = normName(order.commune);
        const match = centers.find((c: any) => normName(c.commune_name || "") === target);
        if (!match?.center_id) {
          isStopdesk = false;
          effectiveDeliveryService = "yalidine_domicile";
        }
        stopdeskId = match?.center_id || null;
      }

      const payload = [{
        order_id: order.order_number,
        from_wilaya_name: "Alger",
        firstname: order.client_name.split(" ")[0] || order.client_name,
        familyname: order.client_name.split(" ").slice(1).join(" ") || "-",
        contact_phone: order.client_phone,
        address: order.address,
        to_commune_name: order.commune,
        to_wilaya_name: order.wilaya,
        product_list: productList || "Produits",
        price: order.total,
        do_insurance: false,
        declared_value: order.subtotal,
        length: 20, width: 15, height: 10, weight: 1,
        freeshipping: false,
        is_stopdesk: isStopdesk,
        ...(isStopdesk && stopdeskId ? { stopdesk_id: stopdeskId } : {}),
        has_exchange: false,
        product_to_collect: null,
      }];

      const resp = await fetch(`${YALIDINE_BASE}/parcels/`, {
        method: "POST",
        headers: { "X-API-ID": apiId, "X-API-TOKEN": apiToken, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await resp.text();
      if (!resp.ok) throw new Error(`Yalidine ${resp.status}: ${text.slice(0, 300)}`);
      const json = JSON.parse(text);
      const first = json[order.order_number] || Object.values(json)[0] as any;
      if (!first?.success) throw new ShipmentError(`Yalidine: ${first?.message || text.slice(0, 200)}`);
      tracking = first.tracking;
      labelUrl = first.label || "";
    } else {
      // ZR Express - schema reel /api/v1/parcels
      const tenantId = Deno.env.get("ZR_TENANT_ID")!;
      const secretKey = Deno.env.get("ZR_SECRET_KEY")!;

      // Recuperer cityTerritoryId (commune) et hub par defaut pour la wilaya
      const { data: zone } = await admin
        .from("delivery_zones")
        .select("code,name,zr_hub_id,zr_district_id")
        .eq("name", order.wilaya).maybeSingle();
      if (!zone) throw new Error(`ZR: wilaya "${order.wilaya}" introuvable`);

      const { data: commune } = await admin
        .from("delivery_communes")
        .select("zr_territory_id,zr_district_id,name")
        .eq("wilaya_code", zone.code)
        .ilike("name", order.commune)
        .maybeSingle();

      let cityTerritoryId = commune?.zr_territory_id;
      let districtTerritoryId = commune?.zr_district_id || zone.zr_district_id;
      if (!cityTerritoryId) {
        const { data: all } = await admin.from("delivery_communes").select("name,zr_territory_id,zr_district_id").eq("wilaya_code", zone.code);
        const target = normName(order.commune);
        const m = (all || []).find((c: any) => normName(c.name) === target && c.zr_territory_id);
        cityTerritoryId = m?.zr_territory_id;
        districtTerritoryId = m?.zr_district_id || districtTerritoryId;
      }
      if (!cityTerritoryId || !districtTerritoryId) {
        const fallbackTerritory = await findZrFallbackTerritory(admin, zone.code, order.commune);
        if (fallbackTerritory?.zr_territory_id && fallbackTerritory?.zr_district_id) {
          cityTerritoryId = fallbackTerritory.zr_territory_id;
          districtTerritoryId = fallbackTerritory.zr_district_id;
          effectiveDeliveryService = "zr_domicile";
        }
      }
      if (!cityTerritoryId || !districtTerritoryId) {
        throw new ShipmentError(`ZR: commune "${order.commune}" non disponible chez ZR. Commande gardee confirmee, creez l'expedition manuellement.`, 200, true);
      }
      let zrDeliveryType: "pickup-point" | "home" = order.delivery_type === "bureau" ? "pickup-point" : "home";
      if (zrDeliveryType === "pickup-point" && (!zone.zr_hub_id || effectiveDeliveryService === "zr_domicile")) {
        // Aucun bureau ZR / commune non liee : bascule auto en domicile
        zrDeliveryType = "home";
        effectiveDeliveryService = "zr_domicile";
      }
      const deliveryType = zrDeliveryType;

      // Normalize phone to E.164 (+213...)
      const digits = (order.client_phone || "").replace(/\D/g, "");
      const phoneIntl = digits.startsWith("213")
        ? `+${digits}`
        : digits.startsWith("0")
        ? `+213${digits.slice(1)}`
        : `+213${digits}`;

      // 1) Create customer first (ZR requires customerId)
      const custResp = await fetch(`${ZR_BASE}/customers/individual`, {
        method: "POST",
        headers: zrHeaders(tenantId, secretKey),
        body: JSON.stringify({ name: order.client_name, phone: { number1: phoneIntl } }),
      });
      const custText = await custResp.text();
      if (!custResp.ok) throw new Error(`ZR customer ${custResp.status}: ${custText.slice(0, 300)}`);
      const customerId = JSON.parse(custText).id;
      if (!customerId) throw new Error("ZR: customerId manquant");

      // 2) Create parcel
      const payload: any = {
        externalId: order.order_number,
        customer: {
          customerId,
          name: order.client_name,
          phone: { number1: phoneIntl },
        },
        deliveryAddress: {
          // ZR : city = wilaya, district = commune
          cityTerritoryId: districtTerritoryId,
          districtTerritoryId: cityTerritoryId,
          street: order.address || order.commune,
        },
        deliveryType,
        amount: order.total,
        description: productList || "Produits",
        weight: { weight: 1 },
        orderedProducts: (items || []).map((i: any) => ({
          productName: i.product_name,
          unitPrice: i.unit_price,
          quantity: i.quantity,
          weight: 0.5,
          stockType: "none",
        })),
      };
      if (deliveryType === "pickup-point" && zone.zr_hub_id) {
        payload.hubId = zone.zr_hub_id;
      }

      const resp = await fetch(`${ZR_BASE}/parcels`, {
        method: "POST",
        headers: zrHeaders(tenantId, secretKey),
        body: JSON.stringify(payload),
      });
      const text = await resp.text();
      if (!resp.ok) throw new Error(`ZR ${resp.status}: ${text.slice(0, 400)}`);
      const json = JSON.parse(text);
      const parcelId = json.id || json.data?.id;
      tracking = json.trackingNumber || json.tracking_number || json.data?.trackingNumber || parcelId || "";
      labelUrl = json.labelUrl || json.label_url || "";
      if (!tracking) throw new Error(`ZR: tracking manquant. Reponse: ${text.slice(0, 200)}`);
    }

    await admin.from("orders").update({
      tracking_number: tracking,
      shipping_label_url: labelUrl || null,
      shipping_created_at: new Date().toISOString(),
      shipping_error: null,
      ...(effectiveDeliveryService !== deliveryService ? { service_livraison: effectiveDeliveryService, delivery_type: "domicile" } : {}),
      status: "Expediee",
    }).eq("id", order_id);

    return new Response(JSON.stringify({ ok: true, tracking_number: tracking, label_url: labelUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-shipment error:", err);
    const msg = (err as Error).message;
    const status = err instanceof ShipmentError ? err.status : 500;
    // Log l'erreur dans la commande si possible
    try {
      if (requestOrderId) {
        const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await admin.from("orders").update({ shipping_error: msg.slice(0, 500) }).eq("id", requestOrderId);
      }
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ error: msg, fallback: err instanceof ShipmentError ? err.fallback : false }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
