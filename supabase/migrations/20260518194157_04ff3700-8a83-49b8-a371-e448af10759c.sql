-- BUG-1: attach trigger for order_number generation
DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '' OR NEW.order_number = 'TEMP')
  EXECUTE FUNCTION public.generate_order_number();

-- Backfill existing TEMP/empty order numbers
UPDATE public.orders
SET order_number = 'CMD-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0')
WHERE order_number IS NULL OR order_number = '' OR order_number = 'TEMP';

-- Attach validate_order trigger (was defined but not attached)
DROP TRIGGER IF EXISTS validate_order_trigger ON public.orders;
CREATE TRIGGER validate_order_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order();

-- BUG-7: remove obsolete default for service_livraison
ALTER TABLE public.orders ALTER COLUMN service_livraison DROP DEFAULT;