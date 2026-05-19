-- Public product catalog view without private inventory/cost data
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public AS
SELECT
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
FROM public.products;

GRANT SELECT ON public.products_public TO anon, authenticated;

-- Products table: public clients must not query internal columns directly
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can view products" ON public.products;
CREATE POLICY "Admins can view products"
ON public.products
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.products FROM anon;

-- Robust order number trigger: generate only when missing or temporary
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.order_number IS NULL OR btrim(NEW.order_number) = '' OR NEW.order_number = 'TEMP' THEN
    NEW.order_number = 'CMD-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_number();

-- Strict server-side order validation
CREATE OR REPLACE FUNCTION public.validate_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.client_name = btrim(COALESCE(NEW.client_name, ''));
  NEW.client_phone = btrim(COALESCE(NEW.client_phone, ''));
  NEW.wilaya = btrim(COALESCE(NEW.wilaya, ''));
  NEW.commune = btrim(COALESCE(NEW.commune, ''));
  NEW.address = btrim(COALESCE(NEW.address, ''));

  IF NEW.client_name = '' OR length(NEW.client_name) > 100 THEN
    RAISE EXCEPTION 'Nom client invalide';
  END IF;
  IF NEW.client_phone !~ '^0[567][0-9]{8}$' THEN
    RAISE EXCEPTION 'Numéro de téléphone invalide';
  END IF;
  IF NEW.wilaya = '' OR length(NEW.wilaya) > 100 THEN
    RAISE EXCEPTION 'Wilaya invalide';
  END IF;
  IF NEW.commune = '' OR length(NEW.commune) > 100 THEN
    RAISE EXCEPTION 'Commune invalide';
  END IF;
  IF NEW.address = '' OR length(NEW.address) > 200 THEN
    RAISE EXCEPTION 'Adresse invalide';
  END IF;
  IF NEW.delivery_type NOT IN ('domicile', 'bureau') THEN
    RAISE EXCEPTION 'Type de livraison invalide';
  END IF;
  IF COALESCE(NEW.delivery_fee, 0) < 0 THEN
    RAISE EXCEPTION 'Frais de livraison invalides';
  END IF;
  IF NEW.subtotal <= 0 THEN
    RAISE EXCEPTION 'Sous-total invalide';
  END IF;
  IF NEW.total <= 0 OR NEW.total < NEW.subtotal THEN
    RAISE EXCEPTION 'Total invalide';
  END IF;
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 500 THEN
    RAISE EXCEPTION 'Note trop longue';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_order_trigger ON public.orders;
CREATE TRIGGER validate_order_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order();

-- Sensitive functions should not be directly executable by public clients
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- Tighten product image storage writes to admins only while preserving public reads
DROP POLICY IF EXISTS "Auth users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;

CREATE POLICY "Admins upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
