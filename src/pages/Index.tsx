import { lazy, Suspense } from "react";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import { TrendingUp, Sparkles, Heart, Shield, Moon, Zap } from "lucide-react";
import { useLang } from "@/context/LanguageContext";

const FeaturedSection = lazy(() => import("@/components/home/FeaturedSection"));
const TrustBadges = lazy(() => import("@/components/home/TrustBadges"));

const SectionFallback = () => <div className="container py-10 min-h-[200px]" aria-hidden="true" />;

const Index = () => {
  const { t } = useLang();
  return (
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
  );
};

export default Index;
