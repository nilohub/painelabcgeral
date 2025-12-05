-- Alterar coluna quantity de integer para numeric para aceitar valores decimais
ALTER TABLE public.sales_data 
ALTER COLUMN quantity TYPE numeric USING quantity::numeric;