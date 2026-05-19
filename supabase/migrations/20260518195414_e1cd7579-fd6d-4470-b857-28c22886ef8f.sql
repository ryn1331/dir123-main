-- Public reads are controlled by column grants; sensitive columns remain ungranted
DROP POLICY IF EXISTS "Admins can view products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone"
ON public.products
FOR SELECT
TO public
USING (true);

REVOKE ALL ON public.products FROM anon, authenticated;
GRANT SELECT (
  id,
  name,
  brand,
  category,
  price,
  old_price,
  image_url,
  gallery,
  flavors,
  weights,
  description,
  nutrition_facts,
  in_stock,
  is_top_sale,
  is_promo,
  rating,
  reviews_count,
  usage_instructions,
  conseils,
  expiration_date,
  objectives,
  created_at,
  updated_at
) ON public.products TO anon, authenticated;
GRANT SELECT (stock_qty) ON public.products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

GRANT SELECT ON public.products_public TO anon, authenticated;
