import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DbProduct } from "@/types/database";
import { formatPrice, getStorageUrl } from "@/types/database";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, Package, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext";

export default function PackBuilder() {
  const { t } = useLang();
  const steps = [
    { id: 1, label: t("packBuilder.step1") },
    { id: 2, label: t("packBuilder.step2") },
    { id: 3, label: t("packBuilder.step3") },
    { id: 4, label: t("packBuilder.step4") },
  ];
  const [step, setStep] = useState(1);
  const [objective, setObjective] = useState("");
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("products_public").select("*").then(({ data }) => {
      setProducts((data as unknown as DbProduct[]) || []);
      setLoading(false);
    });
  }, []);

  const wheys = products.filter((p) => p.category === "whey");
  const complements = products.filter((p) => ["creatine", "preworkout", "bcaa", "fatburner"].includes(p.category));

  const selected = products.filter((p) => selectedIds.includes(p.id));
  const total = selected.reduce((sum, p) => sum + p.price, 0);

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleOrder = () => {
    selected.forEach((p) => {
      addItem(p, p.flavors?.[0] || "Nature", p.weights?.[0] || "", 1);
    });
    navigate("/checkout");
  };

  if (loading) return <div className="container py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="container py-6 md:py-10 min-h-screen">
      <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">{t("packBuilder.heading")} <span className="text-primary">{t("packBuilder.pack")}</span></h1>
      <p className="text-muted-foreground text-sm mb-8">{t("packBuilder.sub")}</p>

      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button onClick={() => setStep(s.id)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${step === s.id ? "gradient-primary text-primary-foreground" : step > s.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {step > s.id ? <Check size={14} /> : <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">{s.id}</span>}
              {s.label}
            </button>
            {i < steps.length - 1 && <ChevronRight size={16} className="text-muted-foreground mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <h2 className="font-heading text-xl font-bold mb-4">{t("packBuilder.q1")}</h2>
                {[
                  { value: "Prise de masse", label: t("packBuilder.priseMasse"), emoji: "🏋️ " },
                  { value: "Sèche", label: t("packBuilder.seche"), emoji: "🔥 " },
                ].map((obj) => (
                  <button key={obj.value} onClick={() => { setObjective(obj.value); setStep(2); }} className={`w-full p-4 rounded-lg border text-left font-heading text-lg transition-colors ${objective === obj.value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"}`}>
                    {obj.emoji}{obj.label}
                  </button>
                ))}
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-heading text-xl font-bold mb-4">{t("packBuilder.q2")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {wheys.map((p) => <PackItem key={p.id} product={p} selected={selectedIds.includes(p.id)} onToggle={() => toggleProduct(p.id)} />)}
                </div>
                <Button onClick={() => setStep(3)} className="mt-4 gradient-primary text-primary-foreground">{t("packBuilder.next")} <ChevronRight size={16} /></Button>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-heading text-xl font-bold mb-4">{t("packBuilder.q3")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {complements.map((p) => <PackItem key={p.id} product={p} selected={selectedIds.includes(p.id)} onToggle={() => toggleProduct(p.id)} />)}
                </div>
                <Button onClick={() => setStep(4)} className="mt-4 gradient-primary text-primary-foreground">{t("packBuilder.viewSummary")} <ChevronRight size={16} /></Button>
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="font-heading text-xl font-bold mb-4">{t("packBuilder.q4")}</h2>
                <p className="text-muted-foreground text-sm">{t("packBuilder.q4Sub")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 h-fit sticky top-20">
          <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"><Package size={18} className="text-primary" /> {t("packBuilder.yourPack")}</h3>
          {selected.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("packBuilder.empty")}</p>
          ) : (
            <div className="space-y-2 mb-4">
              {selected.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="text-primary font-medium shrink-0 ml-2">{formatPrice(p.price)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="font-heading font-bold">{t("packBuilder.total")}</span>
            <span className="font-heading text-xl font-bold text-primary">{formatPrice(total)}</span>
          </div>
          <Button onClick={handleOrder} disabled={selected.length === 0} className="w-full mt-4 h-12 font-heading gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {t("packBuilder.orderPack")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PackItem({ product, selected, onToggle }: { product: DbProduct; selected: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`p-3 rounded-lg border text-left transition-all ${selected ? "border-primary bg-primary/10 neon-glow" : "border-border bg-card hover:border-primary/30"}`}>
      <img src={getStorageUrl(product.image_url)} alt={product.name} className="w-full aspect-square rounded-md object-cover mb-2" />
      <p className="text-sm font-medium truncate">{product.name}</p>
      <p className="text-xs text-muted-foreground">{product.brand}</p>
      <p className="font-heading font-bold text-primary text-sm mt-1">{formatPrice(product.price)}</p>
      {selected && <Check size={16} className="text-primary mt-1" />}
    </button>
  );
}
