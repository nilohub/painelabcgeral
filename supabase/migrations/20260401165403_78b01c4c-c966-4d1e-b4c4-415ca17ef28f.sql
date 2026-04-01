CREATE OR REPLACE FUNCTION public.get_avg_sales_by_product(months_back integer DEFAULT 2)
RETURNS TABLE(store text, product_code text, avg_monthly_sales numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH recent_months AS (
    SELECT DISTINCT year, month
    FROM sales_data
    ORDER BY year DESC, month DESC
    LIMIT months_back
  )
  SELECT 
    sd.store,
    sd.product_code,
    SUM(sd.sales_value) / months_back AS avg_monthly_sales
  FROM sales_data sd
  INNER JOIN recent_months rm ON sd.year = rm.year AND sd.month = rm.month
  GROUP BY sd.store, sd.product_code
$$;