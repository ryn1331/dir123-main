CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_product_id IS NULL OR p_quantity = 0 THEN
    RAISE EXCEPTION 'Invalid stock adjustment';
  END IF;

  UPDATE public.products
  SET stock_qty = GREATEST(0, COALESCE(stock_qty, 0) - p_quantity),
      in_stock = (GREATEST(0, COALESCE(stock_qty, 0) - p_quantity) > 0),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated;
