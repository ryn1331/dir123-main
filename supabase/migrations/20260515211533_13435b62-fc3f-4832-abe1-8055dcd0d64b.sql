CREATE TABLE IF NOT EXISTS public.delivery_communes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wilaya_code text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(wilaya_code, name)
);
CREATE INDEX IF NOT EXISTS idx_delivery_communes_wilaya ON public.delivery_communes(wilaya_code);
ALTER TABLE public.delivery_communes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Communes viewable by everyone" ON public.delivery_communes FOR SELECT USING (true);
CREATE POLICY "Admins manage communes" ON public.delivery_communes FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));