import { useState, useEffect, useMemo, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { DashboardFilters } from "@/components/DashboardFilters";
import { StatsCards } from "@/components/StatsCards";
import { SalesCharts } from "@/components/SalesCharts";
import { TopProductsTable } from "@/components/TopProductsTable";
import { ProductSearch } from "@/components/ProductSearch";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileWarning } from "lucide-react";

export interface Filters {
  year: string;
  month: string;
  stores: string[];
  subgroup: string;
}

export interface DashboardStats {
  total_sales: number;
  total_profit: number;
  total_quantity: number;
  unique_products: number;
  unique_stores: number;
  top_product: { desc: string; sales: number } | null;
}

export interface MonthlyChartRow {
  data_year: number;
  data_month: number;
  total_sales: number;
  total_profit: number;
  total_quantity: number;
}

export interface StoreChartRow {
  store: string;
  total_sales: number;
  total_profit: number;
  total_quantity: number;
}

export interface SubgroupChartRow {
  subgroup: string;
  total_sales: number;
  total_profit: number;
  total_quantity: number;
}

export interface ProductRow {
  product_code: string;
  product_description: string;
  total_sales: number;
  total_profit: number;
  total_quantity: number;
}

export interface ProductTrendRow {
  product_code: string;
  product_description: string;
  data_year: number;
  data_month: number;
  total_sales: number;
}

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    year: "all",
    month: "all",
    stores: [],
    subgroup: "all"
  });
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyChartRow[]>([]);
  const [storeData, setStoreData] = useState<StoreChartRow[]>([]);
  const [subgroupData, setSubgroupData] = useState<SubgroupChartRow[]>([]);
  const [topProducts, setTopProducts] = useState<ProductRow[]>([]);
  const [productTrends, setProductTrends] = useState<ProductTrendRow[]>([]);

  const [availableFilters, setAvailableFilters] = useState({
    years: [] as string[],
    months: [] as string[],
    stores: [] as string[],
    subgroups: [] as string[]
  });

  const filterParams = useMemo(() => ({
    p_year: filters.year !== "all" ? parseInt(filters.year) : null,
    p_month: filters.month !== "all" ? parseInt(filters.month) : null,
    p_stores: filters.stores.length > 0 ? filters.stores : null,
    p_subgroup: filters.subgroup !== "all" ? filters.subgroup : null,
  }), [filters]);

  // Search filtering on loaded products
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return topProducts;
    const term = searchTerm.toLowerCase();
    return topProducts.filter(p =>
      p.product_code.toLowerCase().includes(term) ||
      p.product_description.toLowerCase().includes(term)
    );
  }, [topProducts, searchTerm]);

  const matchedProductName = useMemo(() => {
    if (!searchTerm.trim() || filteredProducts.length === 0) return undefined;
    const first = filteredProducts[0];
    return `${first.product_code} - ${first.product_description}`;
  }, [filteredProducts, searchTerm]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filterParams]);

  const fetchFilterOptions = async () => {
    const { data } = await supabase.rpc("get_filter_options");
    if (data) {
      const d = data as any;
      setAvailableFilters({
        years: (d.years || []).map(String),
        months: (d.months || []).map(String),
        stores: (d.stores || []).map(String),
        subgroups: (d.subgroups || []).map(String),
      });
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);

    // All RPC calls in parallel
    const [statsRes, monthlyRes, storeRes, subgroupRes, productsRes, trendsRes] = await Promise.all([
      supabase.rpc("get_dashboard_stats", filterParams),
      supabase.rpc("get_monthly_chart_data", filterParams),
      supabase.rpc("get_store_chart_data", filterParams),
      supabase.rpc("get_subgroup_chart_data", filterParams),
      supabase.rpc("get_top_products_data", { ...filterParams, p_limit: 50 }),
      supabase.rpc("get_product_trends_data", { ...filterParams, p_limit: 100 }),
    ]);

    const statsData = statsRes.data as any;
    if (statsData) {
      setStats(statsData);
      setHasData(Number(statsData.total_sales) > 0 || Number(statsData.total_quantity) > 0);
    } else {
      setHasData(false);
    }

    setMonthlyData((monthlyRes.data as MonthlyChartRow[]) || []);
    setStoreData((storeRes.data as StoreChartRow[]) || []);
    setSubgroupData((subgroupRes.data as SubgroupChartRow[]) || []);
    setTopProducts((productsRes.data as ProductRow[]) || []);
    setProductTrends((trendsRes.data as ProductTrendRow[]) || []);

    setLoading(false);
  };

  const handleFilterChange = (key: keyof Filters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!hasData) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <FileWarning className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Nenhum dado encontrado</h2>
              <p className="mt-1 text-muted-foreground">
                Faça upload de arquivos Excel para começar a análise
              </p>
            </div>
            <a href="/upload" className="mt-4 inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-105">
              Fazer Upload
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Análise completa dos dados de vendas por período</p>
          </div>
          <ProductSearch
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={searchTerm ? filteredProducts.length : undefined}
            matchedProduct={matchedProductName}
          />
        </div>

        <DashboardFilters filters={filters} availableFilters={availableFilters} onFilterChange={handleFilterChange} />

        {stats && <StatsCards stats={stats} />}

        <SalesCharts
          monthlyData={monthlyData}
          storeData={storeData}
          subgroupData={subgroupData}
          topProducts={searchTerm ? filteredProducts : topProducts}
          productTrends={productTrends}
        />

        <TopProductsTable products={searchTerm ? filteredProducts : topProducts} />
      </div>
    </Layout>
  );
};

export default Index;
