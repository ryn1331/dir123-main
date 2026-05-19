-- Make public catalog view evaluate permissions as the caller, not the owner
ALTER VIEW public.products_public SET (security_invoker = true);

-- Replace permissive anonymous insert policies with validation policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create valid orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  length(btrim(client_name)) BETWEEN 2 AND 100
  AND client_phone ~ '^0[567][0-9]{8}$'
  AND length(btrim(wilaya)) BETWEEN 1 AND 100
  AND length(btrim(commune)) BETWEEN 1 AND 100
  AND length(btrim(address)) BETWEEN 3 AND 200
  AND delivery_type IN ('domicile', 'bureau')
  AND COALESCE(delivery_fee, 0) >= 0
  AND subtotal > 0
  AND total >= subtotal
  AND status = 'En préparation'
  AND (notes IS NULL OR length(notes) <= 500)
);

DROP POLICY IF EXISTS "Anyone can create clients" ON public.clients;
CREATE POLICY "Anyone can create valid clients"
ON public.clients
FOR INSERT
TO public
WITH CHECK (
  length(btrim(name)) BETWEEN 2 AND 100
  AND phone ~ '^0[567][0-9]{8}$'
  AND (email IS NULL OR length(email) <= 255)
  AND (wilaya IS NULL OR length(btrim(wilaya)) BETWEEN 1 AND 100)
);

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create valid order items"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (
  length(btrim(product_name)) BETWEEN 1 AND 150
  AND quantity BETWEEN 1 AND 99
  AND unit_price > 0
  AND total_price = unit_price * quantity
  AND (weight IS NULL OR length(weight) <= 50)
  AND (flavor IS NULL OR length(flavor) <= 80)
);

-- Public bucket files remain URL-accessible, but object listing is no longer public
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
