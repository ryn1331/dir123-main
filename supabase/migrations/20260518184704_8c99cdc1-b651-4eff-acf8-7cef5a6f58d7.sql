ALTER TABLE public.delivery_communes ADD COLUMN IF NOT EXISTS zr_territory_id uuid;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS zr_hub_id uuid;
ALTER TABLE public.delivery_zones ADD COLUMN IF NOT EXISTS zr_district_id uuid;
CREATE INDEX IF NOT EXISTS idx_delivery_communes_wilaya_code ON public.delivery_communes(wilaya_code);
CREATE INDEX IF NOT EXISTS idx_delivery_communes_name ON public.delivery_communes(lower(name));