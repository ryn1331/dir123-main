import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/context/LanguageContext";

import beauteHero from "@/assets/categories/cat-beaute-hero.jpg";
import santeHero from "@/assets/categories/cat-sante-hero.jpg";

const mainCategories = [
  {
    titleKey: "universe.beaute.title",
    descKey: "universe.beaute.desc",
    image: beauteHero,
    universe: "beaute",
    subcategories: [
      { key: "sub.soins-visage", slug: "soins-visage" },
      { key: "sub.soins-corps", slug: "soins-corps" },
      { key: "sub.cheveux", slug: "cheveux" },
      { key: "sub.ongles", slug: "ongles" },
      { key: "sub.anti-age", slug: "anti-age" },
      { key: "sub.collagene", slug: "collagene" },
      { key: "sub.eclat-teint", slug: "eclat-teint" },
    ],
  },
  {
    titleKey: "universe.sante.title",
    descKey: "universe.sante.desc",
    image: santeHero,
    universe: "sante",
    subcategories: [
      { key: "sub.immunite", slug: "immunite" },
      { key: "sub.stress", slug: "stress" },
      { key: "sub.energie", slug: "energie" },
      { key: "sub.cerveau", slug: "cerveau" },
      { key: "sub.os", slug: "os" },
      { key: "sub.coeur", slug: "coeur" },
      { key: "sub.hormones", slug: "hormones" },
      { key: "sub.perte-de-poids", slug: "perte-de-poids" },
      { key: "sub.muscles", slug: "muscles" },
      { key: "sub.digestion", slug: "digestion" },
      { key: "sub.detox", slug: "detox" },
      { key: "sub.multivitamines", slug: "multivitamines" },
    ],
  },
];

export default function CategoryGrid() {
  const { t } = useLang();
  return (
    <section id="categories" className="py-10 md:py-16 bg-background" aria-label={t("universe.sectionLabel")}>
      <div className="container">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-body mb-2">{t("universe.sectionLabel")}</p>
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
            {t("universe.heading")}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {mainCategories.map((cat) => (
            <div
              key={cat.universe}
              className="group relative rounded-3xl overflow-hidden bg-card border border-border/40 hover:shadow-2xl hover:shadow-foreground/5 transition-all duration-500"
            >
              <div className="relative h-[220px] md:h-[280px] overflow-hidden">
                <img
                  src={cat.image}
                  alt=""
                  role="presentation"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={1024}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                  <h3 className="font-heading text-xl md:text-2xl font-bold text-background mb-1.5">
                    {t(cat.titleKey)}
                  </h3>
                  <p className="text-background/60 text-xs md:text-sm font-body leading-relaxed max-w-[280px]">
                    {t(cat.descKey)}
                  </p>
                </div>
              </div>

              <div className="p-4 md:p-6">
                <div className="flex flex-wrap gap-2">
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.slug}
                      to={`/catalogue?univers=${cat.universe}&cat=${sub.slug}`}
                      className="px-3.5 py-1.5 rounded-full text-xs font-body font-medium bg-secondary/60 text-muted-foreground hover:bg-foreground hover:text-background transition-all duration-200"
                    >
                      {t(sub.key)}
                    </Link>
                  ))}
                </div>
                <Link
                  to={`/catalogue?univers=${cat.universe}`}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-body font-medium text-foreground hover:text-muted-foreground transition-colors group/link"
                >
                  {t("universe.viewCollection")}
                  <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
