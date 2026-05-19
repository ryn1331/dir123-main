import { useMemo, useRef } from "react";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import { getStorageUrl, formatPrice, type DbProduct } from "@/types/database";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAllProducts } from "@/hooks/useAllProducts";

type SectionType = "top" | "promo" | "new" | "category" | "beauty";

interface FeaturedSectionProps {
  type: SectionType;
  category?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  limit?: number;
}

const BEAUTY_CATS = new Set(["soins-visage", "soins-corps", "cheveux", "ongles", "anti-age", "collagene", "eclat-teint"]);

export default function FeaturedSection({ type, category, title, subtitle, icon, limit = 8 }: FeaturedSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const skeletonCount = Math.min(limit, 4);

  const { data: allProducts = [], isLoading } = useAllProducts();

  const products = useMemo<DbProduct[]>(() => {
    let list = allProducts;
    if (type === "top") list = list.filter((p) => p.is_top_sale);
    else if (type === "promo") list = list.filter((p) => p.is_promo);
    else if (type === "beauty") list = list.filter((p) => BEAUTY_CATS.has(p.category));
    else if (type === "category" && category) list = list.filter((p) => p.category === category);
    // "new" uses the default order (created_at desc) from useAllProducts
    return list.slice(0, limit);
  }, [allProducts, type, category, limit]);


  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
  };

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-8 md:py-14" aria-label={title}>
      <div className="container">
        <div className="flex items-end justify-between mb-5 md:mb-8">
          <div>
            {subtitle && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body mb-1.5">{subtitle}</p>}
            <h2 className="font-heading text-lg md:text-2xl font-bold text-foreground leading-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll("left")} aria-label="Défiler à gauche" className="w-8 h-8 rounded-full border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors hidden md:flex">
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <button onClick={() => scroll("right")} aria-label="Défiler à droite" className="w-8 h-8 rounded-full border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors hidden md:flex">
              <ChevronRight size={15} aria-hidden="true" />
            </button>
            <Link to={category ? `/catalogue?cat=${category}` : "/catalogue"} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap underline underline-offset-4">
              Voir tout
            </Link>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible"
          role="list"
        >
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <div key={i} className="snap-start shrink-0 w-[44vw] sm:w-[42vw] md:w-auto">
                  <ProductCardSkeleton />
                </div>
              ))
            : products.map((p) => {
                const discount = p.old_price ? Math.round(((p.old_price - p.price) / p.old_price) * 100) : 0;
                return (
                  <article
                    key={p.id}
                    role="listitem"
                    className="snap-start shrink-0 w-[44vw] sm:w-[42vw] md:w-auto"
                  >
                    <Link
                      to={`/produit/${p.id}`}
                      className="group block rounded-2xl border border-border/60 bg-card overflow-hidden card-hover relative"
                      aria-label={`${p.name} — ${formatPrice(p.price)}`}
                    >
                      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                        {p.is_top_sale && (
                          <span className="badge-top text-[9px]">Populaire</span>
                        )}
                        {discount > 0 && (
                          <span className="badge-promo text-[9px]">-{discount}%</span>
                        )}
                      </div>
                      <div className="aspect-square overflow-hidden relative bg-secondary/40">
                        <img
                          src={getStorageUrl(p.image_url, 300)}
                          alt={p.name}
                          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                          width={300}
                          height={300}
                        />
                      </div>

                      <div className="p-3 md:p-4">
                        <h3 className="font-body font-medium text-xs md:text-sm leading-snug line-clamp-2 min-h-[2rem] md:min-h-[2.5rem] text-foreground">
                          {p.name}
                        </h3>
                        <div className="flex items-baseline gap-1.5 mt-2">
                          <span className="font-heading font-bold text-foreground text-sm md:text-base">
                            {formatPrice(p.price)}
                          </span>
                          {p.old_price && (
                            <span className="text-[10px] text-muted-foreground line-through" aria-label={`Ancien prix: ${formatPrice(p.old_price)}`}>
                              {formatPrice(p.old_price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
        </div>
      </div>
    </section>
  );
}
