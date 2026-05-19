// Test automatique : vérifie que chaque (wilaya, commune) ZR Express
// peut résoudre une expédition (lien direct, fallback legacy, ou fallback global).
// Reproduit exactement la logique de supabase/functions/create-shipment/index.ts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const ZR_LEGACY: Record<string, string> = {
  "33": "30", "37": "08", "49": "39", "50": "47",
  "52": "01", "53": "08", "54": "01", "56": "30",
  "57": "11", "58": "11",
};

const normName = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

const { data: zones } = await admin
  .from("delivery_zones")
  .select("code,name,has_zr_express,zr_hub_id")
  .eq("has_zr_express", true);

const { data: allCommunes } = await admin
  .from("delivery_communes")
  .select("wilaya_code,name,zr_territory_id,zr_district_id")
  .limit(5000);

const linkedGlobal = (allCommunes || []).filter((c) => c.zr_territory_id && c.zr_district_id);
const byWilayaLinked = new Map<string, typeof linkedGlobal>();
for (const c of linkedGlobal) {
  const arr = byWilayaLinked.get(c.wilaya_code) || [];
  arr.push(c);
  byWilayaLinked.set(c.wilaya_code, arr);
}

type Result = { wilaya: string; commune: string; status: string; via?: string; bureau: boolean };
const results: Result[] = [];

for (const zone of zones || []) {
  const { data: communes } = await admin
    .from("delivery_communes")
    .select("name,zr_territory_id,zr_district_id")
    .eq("wilaya_code", zone.code);

  for (const c of communes || []) {
    const bureau = !!zone.zr_hub_id;
    let status = "FAIL";
    let via = "";

    if (c.zr_territory_id && c.zr_district_id) {
      status = "OK";
      via = "direct";
    } else {
      const target = normName(c.name);
      const same = byWilayaLinked.get(zone.code) || [];
      if (same.find((x) => normName(x.name) === target) || same[0]) {
        status = "OK"; via = "same-wilaya-fallback";
      } else {
        const legacy = ZR_LEGACY[zone.code];
        const legacyArr = legacy ? byWilayaLinked.get(legacy) || [] : [];
        if (legacyArr.find((x) => normName(x.name) === target) || legacyArr[0]) {
          status = "OK"; via = `legacy-${legacy}`;
        } else if (linkedGlobal.find((x) => normName(x.name) === target)) {
          status = "OK"; via = "global-name-match";
        } else if (linkedGlobal.length > 0) {
          status = "OK"; via = "global-default";
        } else {
          status = "FAIL"; via = "no-mapping";
        }
      }
    }
    results.push({ wilaya: `${zone.code} ${zone.name}`, commune: c.name, status, via, bureau });
  }
}

const ok = results.filter((r) => r.status === "OK").length;
const fail = results.filter((r) => r.status === "FAIL");

console.log(`\n=== TEST ZR EXPRESS — COUVERTURE COMMUNES ===`);
console.log(`Total communes testées : ${results.length}`);
console.log(`✅ Résolvables         : ${ok}`);
console.log(`❌ Échecs              : ${fail.length}\n`);

const viaCounts: Record<string, number> = {};
for (const r of results) viaCounts[r.via!] = (viaCounts[r.via!] || 0) + 1;
console.log("Répartition par mode de résolution :");
for (const [k, v] of Object.entries(viaCounts)) console.log(`  ${k.padEnd(25)} ${v}`);

if (fail.length) {
  console.log("\nÉchecs (premiers 50) :");
  for (const r of fail.slice(0, 50)) console.log(`  ${r.wilaya} / ${r.commune}`);
}

const bureauOnly = results.filter((r) => r.bureau).length;
console.log(`\nWilayas avec hub bureau : ${new Set(results.filter(r=>r.bureau).map(r=>r.wilaya)).size}`);
console.log(`Wilayas domicile only   : ${new Set(results.filter(r=>!r.bureau).map(r=>r.wilaya)).size}`);

Deno.exit(fail.length ? 1 : 0);
