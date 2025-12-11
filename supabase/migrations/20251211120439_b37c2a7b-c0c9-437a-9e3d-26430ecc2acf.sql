
-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('semanal', 'comerciante', 'especial_carnes', 'final_de_semana', 'super_feira')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  lamina_number INTEGER NOT NULL CHECK (lamina_number BETWEEN 1 AND 5),
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offer_products table
CREATE TABLE public.offer_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  session_name TEXT,
  other_codes TEXT,
  main_code TEXT NOT NULL,
  description TEXT NOT NULL,
  management_cost NUMERIC NOT NULL DEFAULT 0,
  price_vila_shopping NUMERIC,
  price_xavantina NUMERIC,
  price_agua_boa NUMERIC,
  price_querencia NUMERIC,
  price_jussara NUMERIC,
  promo_price NUMERIC NOT NULL,
  margin NUMERIC,
  cpf_limit INTEGER,
  promo_type TEXT CHECK (promo_type IN ('geral', 'clube')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_products ENABLE ROW LEVEL SECURITY;

-- Create policies for offers
CREATE POLICY "Allow public read offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Allow public insert offers" ON public.offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete offers" ON public.offers FOR DELETE USING (true);

-- Create policies for offer_products
CREATE POLICY "Allow public read offer_products" ON public.offer_products FOR SELECT USING (true);
CREATE POLICY "Allow public insert offer_products" ON public.offer_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete offer_products" ON public.offer_products FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_offers_type ON public.offers(offer_type);
CREATE INDEX idx_offers_dates ON public.offers(start_date, end_date);
CREATE INDEX idx_offer_products_offer_id ON public.offer_products(offer_id);
CREATE INDEX idx_offer_products_main_code ON public.offer_products(main_code);
