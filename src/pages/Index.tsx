import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { DashboardFilters } from "@/components/DashboardFilters";
import { StatsCards } from "@/components/StatsCards";
import { SalesCharts } from "@/components/SalesCharts";
import { TopProductsTable } from "@/components/TopProductsTable";
import { ProductSearch } from "@/components/ProductSearch";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileWarning } from "lucide-react";
export interface SalesData {
  id: string;
  year: number;
  month: number;
  store: string;
  subgroup: string;
  product_code: string;
  product_description: string;
  quantity: number;
  sales_value: number;
  profit: number;
  quantity_percentage: number;
  sales_percentage: number;
  profit_percentage: number;
}
export interface Filters {
  year: string;
  month: string;
  store: string;
  subgroup: string;
}
const Index = () => {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    year: "all",
    month: "all",
    store: "all",
    subgroup: "all"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => item.product_code.toLowerCase().includes(term) || item.product_description.toLowerCase().includes(term));
  }, [data, searchTerm]);

  const matchedProductName = useMemo(() => {
    if (!searchTerm.trim() || filteredData.length === 0) return undefined;
    const firstMatch = filteredData[0];
    return `${firstMatch.product_code} - ${firstMatch.product_description}`;
  }, [filteredData, searchTerm]);
  const [availableFilters, setAvailableFilters] = useState({
    years: [] as string[],
    months: [] as string[],
    stores: [] as string[],
    subgroups: [] as string[]
  });
  useEffect(() => {
    fetchData();
    fetchFilterOptions();
  }, []);
  useEffect(() => {
    fetchData();
  }, [filters]);
  const fetchFilterOptions = async () => {
    // Fetch all filter options with pagination to avoid 1000 row limit
    let allFilterData: { year: number; month: number; store: string; subgroup: string }[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: salesData } = await supabase
        .from("sales_data")
        .select("year, month, store, subgroup")
        .range(from, from + batchSize - 1);
      
      if (salesData && salesData.length > 0) {
        allFilterData = [...allFilterData, ...salesData];
        from += batchSize;
        hasMore = salesData.length === batchSize;
      } else {
        hasMore = false;
      }
    }
    
    if (allFilterData.length > 0) {
      const years = [...new Set(allFilterData.map(d => d.year.toString()))].sort();
      const months = [...new Set(allFilterData.map(d => d.month.toString()))].sort((a, b) => Number(a) - Number(b));
      const stores = [...new Set(allFilterData.map(d => d.store))].sort();
      const subgroups = [...new Set(allFilterData.map(d => d.subgroup))].sort();
      setAvailableFilters({
        years,
        months,
        stores,
        subgroups
      });
    }
  };
  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all data with pagination to avoid default 1000 row limit
    let allData: SalesData[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      let query = supabase.from("sales_data").select("*").range(from, from + batchSize - 1);
      
      if (filters.year !== "all") {
        query = query.eq("year", parseInt(filters.year));
      }
      if (filters.month !== "all") {
        query = query.eq("month", parseInt(filters.month));
      }
      if (filters.store !== "all") {
        query = query.eq("store", filters.store);
      }
      if (filters.subgroup !== "all") {
        query = query.eq("subgroup", filters.subgroup);
      }
      
      const { data: salesData, error } = await query;
      
      if (error) {
        console.error("Error fetching data:", error);
        hasMore = false;
      } else if (salesData && salesData.length > 0) {
        allData = [...allData, ...salesData];
        from += batchSize;
        hasMore = salesData.length === batchSize;
      } else {
        hasMore = false;
      }
    }
    
    setData(allData);
    setLoading(false);
  };
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  if (loading) {
    return <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </Layout>;
  }
  if (data.length === 0) {
    return <Layout>
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
      </Layout>;
  }
  return <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Análise completa dos dados de vendas por período</p>
          </div>
          <ProductSearch 
            value={searchTerm} 
            onChange={setSearchTerm} 
            resultCount={searchTerm ? filteredData.length : undefined}
            matchedProduct={matchedProductName}
          />
        </div>

        <DashboardFilters filters={filters} availableFilters={availableFilters} onFilterChange={handleFilterChange} />

        <StatsCards data={filteredData} />

        <SalesCharts data={filteredData} />

        <TopProductsTable data={filteredData} />
      </div>
    </Layout>;
};
export default Index;