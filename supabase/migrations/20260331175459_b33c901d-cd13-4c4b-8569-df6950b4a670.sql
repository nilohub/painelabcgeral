CREATE TABLE public.current_stock (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store text NOT NULL,
  barcode text,
  product_code text NOT NULL,
  product_description text NOT NULL,
  stock_value numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.current_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read current_stock" ON public.current_stock FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert current_stock" ON public.current_stock FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public delete current_stock" ON public.current_stock FOR DELETE TO public USING (true);