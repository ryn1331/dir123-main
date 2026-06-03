import { lazy, Suspense } from "react";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import { TrendingUp, Sparkles, Heart, Shield, Moon, Zap } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { Helmet } from "react-helmet-async";

const FeaturedSection = lazy(() => import("@/components/home/FeaturedSection"));
const TrustBadges = lazy(() => import("@/components/home/TrustBadges"));

const SectionFallback = () => <div className="container py-10 min-h-[200px]" aria-hidden="true" />;

const Index = () => {
  const { t } = useLang();
  const title = "Dir l'Affaire — Cosmétiques bio & compléments en Algérie";
  const description = "Boutique premium algérienne : cosmétiques bio, soins visage et corps, compléments alimentaires. Livraison rapide, paiement à la livraison.";
  const canonical = "https://dirlaffaire14.com/";
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content="https://dirlaffaire14.com/placeholder.svg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://dirlaffaire14.com/placeholder.svg" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Dir l'Affaire",
            url: canonical,
            logo: "https://dirlaffaire14.com/placeholder.svg",
            description: description,
            sameAs: [],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "Customer Support",
              areaServed: "DZ"
            }
          })}
        </script>
      </Helmet>
      <div className="min-h-screen">
        <HeroSection />
        <CategoryGrid />

      <Suspense fallback={<SectionFallback />}>
        <FeaturedSection type="top" title={t("home.top.title")} subtitle={t("home.top.sub")} icon={<TrendingUp size={18} />} />

        <FeaturedSection type="beauty" title={t("home.beauty.title")} subtitle={t("home.beauty.sub")} icon={<Heart size={18} />} />

        <div className="bg-secondary/20">
          <FeaturedSection type="category" category="immunite" title={t("home.immunite.title")} subtitle={t("home.immunite.sub")} icon={<Shield size={18} />} />
        </div>

        <FeaturedSection type="category" category="stress" title={t("home.stress.title")} icon={<Moon size={18} />} />

        <div className="bg-secondary/20">
          <FeaturedSection type="category" category="energie" title={t("home.energie.title")} icon={<Zap size={18} />} />
        </div>

        <FeaturedSection type="new" title={t("home.new.title")} subtitle={t("home.new.sub")} icon={<Sparkles size={18} />} limit={4} />

        <TrustBadges />
        </Suspense>
      </div>
    </>
  );
};

export default Index;
