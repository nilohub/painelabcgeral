
CREATE OR REPLACE FUNCTION public.get_rising_products(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_stores text[] DEFAULT NULL,
  p_subgroup text DEFAULT NULL
)
RETURNS TABLE(
  product_code text,
  product_description text,
  first_period_label text,
  second_period_label text,
  first_period_sales numeric,
  second_period_sales numeric,
  first_period_profit numeric,
  second_period_profit numeric,
  sales_delta_pct numeric,
  profit_delta_pct numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
WITH filtered AS (
  SELECT * FROM sales_data
  WHERE (p_year IS NULL OR year = p_year)
    AND (p_month IS NULL OR month = p_month)
    AND (p_stores IS NULL OR store = ANY(p_stores))
    AND (p_subgroup IS NULL OR subgroup = p_subgroup)
),
periods AS (
  SELECT DISTINCT (year * 100 + month) AS ym FROM filtered
),
ordered AS (
  SELECT ym,
         row_number() OVER (ORDER BY ym) AS rn,
         count(*) OVER () AS total
  FROM periods
),
split AS (
  SELECT ym,
         CASE WHEN rn <= GREATEST(total/2, 1) THEN 1 ELSE 2 END AS half
  FROM ordered
),
labels AS (
  SELECT 
    MIN(CASE WHEN half = 1 THEN ym END) AS first_min,
    MAX(CASE WHEN half = 1 THEN ym END) AS first_max,
    MIN(CASE WHEN half = 2 THEN ym END) AS second_min,
    MAX(CASE WHEN half = 2 THEN ym END) AS second_max
  FROM split
),
agg AS (
  SELECT 
    f.product_code,
    max(f.product_description) AS product_description,
    SUM(CASE WHEN s.half = 1 THEN f.sales_value ELSE 0 END) AS first_sales,
    SUM(CASE WHEN s.half = 2 THEN f.sales_value ELSE 0 END) AS second_sales,
    SUM(CASE WHEN s.half = 1 THEN f.profit ELSE 0 END) AS first_profit,
    SUM(CASE WHEN s.half = 2 THEN f.profit ELSE 0 END) AS second_profit
  FROM filtered f
  JOIN split s ON (f.year * 100 + f.month) = s.ym
  GROUP BY f.product_code
)
SELECT 
  a.product_code,
  a.product_description,
  CASE WHEN l.first_min IS NULL THEN '-' 
       ELSE (l.first_min / 100)::text || '/' || lpad((l.first_min % 100)::text, 2, '0')
            || CASE WHEN l.first_min <> l.first_max 
                    THEN ' - ' || (l.first_max / 100)::text || '/' || lpad((l.first_max % 100)::text, 2, '0')
                    ELSE '' END
  END,
  CASE WHEN l.second_min IS NULL THEN '-' 
       ELSE (l.second_min / 100)::text || '/' || lpad((l.second_min % 100)::text, 2, '0')
            || CASE WHEN l.second_min <> l.second_max 
                    THEN ' - ' || (l.second_max / 100)::text || '/' || lpad((l.second_max % 100)::text, 2, '0')
                    ELSE '' END
  END,
  a.first_sales,
  a.second_sales,
  a.first_profit,
  a.second_profit,
  CASE WHEN a.first_sales > 0 THEN ROUND(((a.second_sales - a.first_sales) / a.first_sales * 100)::numeric, 2) ELSE NULL END,
  CASE WHEN a.first_profit > 0 THEN ROUND(((a.second_profit - a.first_profit) / a.first_profit * 100)::numeric, 2) ELSE NULL END
FROM agg a
CROSS JOIN labels l
WHERE a.first_sales > 0 
  AND a.first_profit > 0
  AND a.second_sales > a.first_sales 
  AND a.second_profit > a.first_profit
ORDER BY (a.second_sales - a.first_sales) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_rising_products(integer, integer, text[], text) TO anon, authenticated, service_role;
