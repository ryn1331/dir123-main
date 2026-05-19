import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DbProduct } from "@/types/database";

/**
 * Fetches all in-stock products once and caches them.
 * Used by every home-page FeaturedSection so the page does ONE network call
 * instead of one per section.
 */
export function useAllProducts() {
  return useQuery({
    queryKey: ["products_public_all"],
    queryFn: async (): Promise<DbProduct[]> => {
      const { data } = await supabase
        .from("products_public")
        .select("id,name,brand,category,price,old_price,image_url,rating,reviews_count,is_promo,is_top_sale,in_stock,created_at")
        .eq("in_stock", true)
        .order("created_at", { ascending: false });
      return (data as DbProduct[]) || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
