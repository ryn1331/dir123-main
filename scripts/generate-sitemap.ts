import { writeFile } from "fs/promises";
// Load local .env for local runs so the script can pick up VITE_SUPABASE_PUBLISHABLE_KEY
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
} catch (e) {
  // ignore if dotenv not available in production
}

const BASE_URL = "https://dirlaffaire14.com";
const PRODUCTS_ENDPOINT = "https://wavcptafcrwwejfahfaw.supabase.co/rest/v1/products_public?select=id&in_stock=eq.true";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

type ProductRow = { id: string | number };

type SitemapEntry = {
  loc: string;
  changefreq: "daily" | "weekly";
  priority: string;
};

const fixedEntries: SitemapEntry[] = [
  { loc: `${BASE_URL}/`, changefreq: "daily", priority: "1.0" },
  { loc: `${BASE_URL}/catalogue`, changefreq: "daily", priority: "0.9" },
  { loc: `${BASE_URL}/catalogue?univers=beaute`, changefreq: "daily", priority: "0.8" },
  { loc: `${BASE_URL}/catalogue?univers=sante`, changefreq: "daily", priority: "0.8" },
];

// Category slugs used on the site (kept in sync with Catalog.tsx)
const BEAUTE_CATS = [
  "soins-visage",
  "soins-corps",
  "soins-dentaires",
  "cheveux",
  "ongles",
  "anti-age",
  "collagene",
  "eclat-teint",
];

const SANTE_CATS = [
  "immunite",
  "stress",
  "energie",
  "cerveau",
  "muscles",
  "os",
  "coeur",
  "hormones",
  "perte-de-poids",
  "detox",
  "digestion",
  "multivitamines",
];

const buildUrlNode = ({ loc, changefreq, priority }: SitemapEntry) => {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
};

async function fetchProducts(): Promise<ProductRow[]> {
  if (!SUPABASE_ANON_KEY) {
    throw new Error("Missing SUPABASE_ANON_KEY");
  }
  const response = await fetch(PRODUCTS_ENDPOINT, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Sitemap fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as ProductRow[];
  return Array.isArray(data) ? data : [];
}

async function generate() {
  let products: ProductRow[] = [];
  try {
    products = await fetchProducts();
  } catch (error) {
    console.warn("Sitemap product fetch failed, generating fixed URLs only.");
    console.warn(error);
  }

  // Only include the canonical product URL (/produit/{id}), not the landing page URL (/l/)
  const productEntries: SitemapEntry[] = products.map((product) => {
    const id = String(product.id);
    return { loc: `${BASE_URL}/produit/${id}`, changefreq: "weekly", priority: "0.7" };
  });

  // Build category entries
  const categoryEntries: SitemapEntry[] = [
    ...BEAUTE_CATS.map((c) => ({ loc: `${BASE_URL}/catalogue?univers=beaute&cat=${c}`, changefreq: "daily", priority: "0.7" })),
    ...SANTE_CATS.map((c) => ({ loc: `${BASE_URL}/catalogue?univers=sante&cat=${c}`, changefreq: "daily", priority: "0.7" })),
  ];

  const entries = [...fixedEntries, ...categoryEntries, ...productEntries].map(buildUrlNode).join("\n");

  const xml = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    entries,
    "</urlset>",
    "",
  ].join("\n");

  await writeFile("public/sitemap.xml", xml, "utf8");
  console.log(`Sitemap generated: ${products.length} products`);
}

generate().catch((error) => {
  console.error(error);
  process.exit(0);
});
