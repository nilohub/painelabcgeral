DROP FUNCTION IF EXISTS public.get_avg_sales_by_product(integer);

CREATE OR REPLACE FUNCTION public.get_stock_days(months_back integer DEFAULT 2, min_days integer DEFAULT 30)
RETURNS TABLE(store text, product_code text, product_description text, stock_value numeric, avg_monthly_sales numeric, days_of_stock integer)
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
  ),
  sales_avg AS (
    SELECT 
      sd.store,
      sd.product_code,
      SUM(sd.sales_value) / months_back AS avg_monthly_sales
    FROM sales_data sd
    INNER JOIN recent_months rm ON sd.year = rm.year AND sd.month = rm.month
    GROUP BY sd.store, sd.product_code
  )
  SELECT 
    cs.store,
    cs.product_code,
    cs.product_description,
    cs.stock_value,
    COALESCE(sa.avg_monthly_sales, 0) AS avg_monthly_sales,
    CASE 
      WHEN COALESCE(sa.avg_monthly_sales, 0) > 0 
      THEN ROUND(cs.stock_value / (sa.avg_monthly_sales / 30))::integer
      ELSE 9999
    END AS days_of_stock
  FROM current_stock cs
  LEFT JOIN sales_avg sa ON cs.store = sa.store AND cs.product_code = sa.product_code
  WHERE CASE 
    WHEN COALESCE(sa.avg_monthly_sales, 0) > 0 
    THEN ROUND(cs.stock_value / (sa.avg_monthly_sales / 30))::integer
    ELSE 9999
  END >= min_days
  ORDER BY days_of_stock DESC;
$$;