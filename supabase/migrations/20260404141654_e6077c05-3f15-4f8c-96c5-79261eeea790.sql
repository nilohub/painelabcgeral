
CREATE OR REPLACE FUNCTION public.get_filter_options()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'years', (SELECT COALESCE(json_agg(DISTINCT year ORDER BY year), '[]'::json) FROM sales_data),
    'months', (SELECT COALESCE(json_agg(DISTINCT month ORDER BY month), '[]'::json) FROM sales_data),
    'stores', (SELECT COALESCE(json_agg(DISTINCT store ORDER BY store), '[]'::json) FROM sales_data),
    'subgroups', (SELECT COALESCE(json_agg(DISTINCT subgroup ORDER BY subgroup), '[]'::json) FROM sales_data)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_stores text[] DEFAULT NULL,
  p_subgroup text DEFAULT NULL
)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH filtered AS (
    SELECT * FROM sales_data
    WHERE (p_year IS NULL OR year = p_year)
      AND (p_month IS NULL OR month = p_month)
      AND (p_stores IS NULL OR store = ANY(p_stores))
      AND (p_subgroup IS NULL OR subgroup = p_subgroup)
  ),
  totals AS (
    SELECT 
      COALESCE(SUM(sales_value), 0) as total_sales,
      COALESCE(SUM(profit), 0) as total_profit,
      COALESCE(SUM(quantity), 0) as total_quantity,
      COUNT(DISTINCT product_code) as unique_products,
      COUNT(DISTINCT store) as unique_stores
    FROM filtered
  ),
  top_product AS (
    SELECT product_description as product_desc, SUM(sales_value) as product_sales
    FROM filtered
    GROUP BY product_code, product_description
    ORDER BY product_sales DESC
    LIMIT 1
  )
  SELECT json_build_object(
    'total_sales', (SELECT total_sales FROM totals),
    'total_profit', (SELECT total_profit FROM totals),
    'total_quantity', (SELECT total_quantity FROM totals),
    'unique_products', (SELECT unique_products FROM totals),
    'unique_stores', (SELECT unique_stores FROM totals),
    'top_product', (SELECT json_build_object('desc', product_desc, 'sales', product_sales) FROM top_product)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_monthly_chart_data(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_stores text[] DEFAULT NULL,
  p_subgroup text DEFAULT NULL
)
RETURNS TABLE(data_year integer, data_month integer, total_sales numeric, total_profit numeric, total_quantity numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sd.year,
    sd.month,
    SUM(sd.sales_value),
    SUM(sd.profit),
    SUM(sd.quantity)
  FROM sales_data sd
  WHERE (p_year IS NULL OR sd.year = p_year)
    AND (p_month IS NULL OR sd.month = p_month)
    AND (p_stores IS NULL OR sd.store = ANY(p_stores))
    AND (p_subgroup IS NULL OR sd.subgroup = p_subgroup)
  GROUP BY sd.year, sd.month
  ORDER BY sd.year, sd.month;
$$;

CREATE OR REPLACE FUNCTION public.get_store_chart_data(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_stores text[] DEFAULT NULL,
  p_subgroup text DEFAULT NULL
)
RETURNS TABLE(store text, total_sales numeric, total_profit numeric, total_quantity numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sd.store,
    SUM(sd.sales_value),
    SUM(sd.profit),
    SUM(sd.quantity)
  FROM sales_data sd
  WHERE (p_year IS NULL OR sd.year = p_year)
    AND (p_month IS NULL OR sd.month = p_month)
    AND (p_stores IS NULL OR sd.store = ANY(p_stores))
    AND (p_subgroup IS NULL OR sd.subgroup = p_subgroup)
  GROUP BY sd.store
  ORDER BY SUM(sd.sales_value) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_subgroup_chart_data(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_stores text[] DEFAULT NULL,
  p_subgroup text DEFAULT NULL
)
RETURNS TABLE(subgroup text, total_sales numeric, total_profit numeric, total_quantity numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sd.subgroup,
    SUM(sd.sales_value),
    SUM(sd.profit),
    SUM(sd.quantity)
  FROM sales_data sd
  WHERE (p_year IS NULL OR sd.year = p_year)
    AND (p_month IS NULL OR sd.month = p_month)
    AND (p_stores IS NULL OR sd.store = ANY(p_stores))
    AND (p_subgroup IS NULL OR sd.subgroup = p_subgroup)
  GROUP BY sd.subgroup
  ORDER BY SUM(sd.sales_value) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_top_products_data(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_stores text[] DEFAULT NULL,
  p_subgroup text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(product_code text, product_description text, total_sales numeric, total_profit numeric, total_quantity numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sd.product_code,
    sd.product_description,
    SUM(sd.sales_value),
    SUM(sd.profit),
    SUM(sd.quantity)
  FROM sales_data sd
  WHERE (p_year IS NULL OR sd.year = p_year)
    AND (p_month IS NULL OR sd.month = p_month)
    AND (p_stores IS NULL OR sd.store = ANY(p_stores))
    AND (p_subgroup IS NULL OR sd.subgroup = p_subgroup)
  GROUP BY sd.product_code, sd.product_description
  ORDER BY SUM(sd.sales_value) DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_product_trends_data(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_stores text[] DEFAULT NULL,
  p_subgroup text DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(product_code text, product_description text, data_year integer, data_month integer, total_sales numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH top_products AS (
    SELECT sd.product_code
    FROM sales_data sd
    WHERE (p_year IS NULL OR sd.year = p_year)
      AND (p_month IS NULL OR sd.month = p_month)
      AND (p_stores IS NULL OR sd.store = ANY(p_stores))
      AND (p_subgroup IS NULL OR sd.subgroup = p_subgroup)
    GROUP BY sd.product_code
    ORDER BY SUM(sd.sales_value) DESC
    LIMIT p_limit
  )
  SELECT 
    sd.product_code,
    sd.product_description,
    sd.year,
    sd.month,
    SUM(sd.sales_value)
  FROM sales_data sd
  INNER JOIN top_products tp ON sd.product_code = tp.product_code
  WHERE (p_year IS NULL OR sd.year = p_year)
    AND (p_stores IS NULL OR sd.store = ANY(p_stores))
    AND (p_subgroup IS NULL OR sd.subgroup = p_subgroup)
  GROUP BY sd.product_code, sd.product_description, sd.year, sd.month
  ORDER BY sd.product_code, sd.year, sd.month;
$$;
