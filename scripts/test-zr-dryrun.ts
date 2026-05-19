// Lance create-shipment en dry_run pour TOUTES les communes des zones ZR.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const URL = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FN = `${URL}/functions/v1/create-shipment`;
const admin = createClient(URL, KEY);

const { data: zones } = await admin
  .from("delivery_zones")
  .select("code,name,zr_hub_id")
  .eq("has_zr_express", true);

type Row = { wilaya: string; commune: string; ok: boolean; via?: string; service?: string; type?: string; error?: string };
const rows: Row[] = [];
let i = 0, total = 0;

const tasks: Promise<void>[] = [];
const all: { wilaya: string; commune: string; delivery_type: string }[] = [];

for (const z of zones || []) {
  const { data: communes } = await admin
    .from("delivery_communes").select("name").eq("wilaya_code", z.code);
  for (const c of communes || []) {
    all.push({ wilaya: z.name, commune: c.name, delivery_type: z.zr_hub_id ? "bureau" : "domicile" });
  }
}
total = all.length;
console.log(`Test dry_run sur ${total} communes (ZR Express)...\n`);

// Concurrence limitee
const CONC = 12;
async function worker(slice: typeof all) {
  for (const t of slice) {
    try {
      const r = await fetch(FN, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ dry_run: true, ...t }),
      });
      const j = await r.json();
      rows.push({
        wilaya: t.wilaya, commune: t.commune,
        ok: !!j.ok, via: j.resolvedVia, service: j.effectiveService, type: j.deliveryType, error: j.error,
      });
    } catch (e) {
      rows.push({ wilaya: t.wilaya, commune: t.commune, ok: false, error: (e as Error).message });
    }
    if (++i % 100 === 0) console.log(`  ${i}/${total}`);
  }
}
const chunk = Math.ceil(all.length / CONC);
for (let k = 0; k < CONC; k++) tasks.push(worker(all.slice(k * chunk, (k + 1) * chunk)));
await Promise.all(tasks);

const ok = rows.filter((r) => r.ok);
const ko = rows.filter((r) => !r.ok);
const viaCounts: Record<string, number> = {};
const svcCounts: Record<string, number> = {};
for (const r of ok) {
  viaCounts[r.via || "?"] = (viaCounts[r.via || "?"] || 0) + 1;
  svcCounts[`${r.service}/${r.type}`] = (svcCounts[`${r.service}/${r.type}`] || 0) + 1;
}
console.log(`\n=== RESULTATS DRY_RUN ZR EXPRESS ===`);
console.log(`Total       : ${rows.length}`);
console.log(`OK          : ${ok.length}`);
console.log(`Echecs      : ${ko.length}`);
console.log(`\nResolution :`);
for (const [k, v] of Object.entries(viaCounts)) console.log(`  ${k.padEnd(20)} ${v}`);
console.log(`\nService / type de livraison effectif :`);
for (const [k, v] of Object.entries(svcCounts)) console.log(`  ${k.padEnd(28)} ${v}`);
if (ko.length) {
  console.log(`\nEchecs :`);
  for (const r of ko.slice(0, 50)) console.log(`  ${r.wilaya} / ${r.commune} -> ${r.error}`);
}
Deno.exit(ko.length ? 1 : 0);
