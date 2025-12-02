-- Tabela para armazenar dados de vendas dos arquivos Excel
CREATE TABLE public.sales_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  store TEXT NOT NULL,
  subgroup TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  sales_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  quantity_percentage DECIMAL(10,4) DEFAULT 0,
  sales_percentage DECIMAL(10,4) DEFAULT 0,
  profit_percentage DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear uploads
CREATE TABLE public.upload_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  store TEXT NOT NULL,
  subgroup TEXT NOT NULL,
  records_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para acesso (sem autenticação para simplificar)
CREATE POLICY "Allow public read sales_data" ON public.sales_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert sales_data" ON public.sales_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete sales_data" ON public.sales_data FOR DELETE USING (true);

CREATE POLICY "Allow public read upload_history" ON public.upload_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert upload_history" ON public.upload_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete upload_history" ON public.upload_history FOR DELETE USING (true);

-- Índices para performance
CREATE INDEX idx_sales_data_filters ON public.sales_data (year, month, store, subgroup);
CREATE INDEX idx_sales_data_month ON public.sales_data (month);