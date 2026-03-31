import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STORE_LABELS: Record<string, string> = {
  "01": "Loja 01",
  "02": "Loja 02",
  "05": "Loja 05",
  "07": "Loja 07",
  "08": "Loja 08",
  "09": "Loja 09",
  "10": "Loja 10",
};

const StockDays = () => {
  const [minDays, setMinDays] = useState(30);
  const [avgMonths, setAvgMonths] = useState(2);
  const [selectedStore, setSelectedStore] = useState("all");

  // Busca estoque
  const { data: stockData = [], isLoading: loadingStock } = useQuery({
    queryKey: ["stock-days", "stock"],
    queryFn: async () => {
      const { data, error } = await supabase.from("current_stock").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Busca vendas para calcular média
  const { data: salesData = [], isLoading: loadingSales } = useQuery({
    queryKey: ["stock-days", "sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_data")
        .select("store, product_code, year, month, sales_value");
      if (error) throw error;
      return data || [];
    },
  });

  const productsWithDays = useMemo(() => {
    if (!stockData.length || !salesData.length) return [];

    // Encontrar os N últimos meses com dados
    const monthKeys = new Set<string>();
    salesData.forEach((s) => monthKeys.add(`${s.year}-${String(s.month).padStart(2, "0")}`));
    const sortedMonths = Array.from(monthKeys).sort().reverse().slice(0, avgMonths);

    // Calcular média de venda mensal por loja+produto
    const salesMap = new Map<string, number>();
    salesData.forEach((s) => {
      const mk = `${s.year}-${String(s.month).padStart(2, "0")}`;
      if (!sortedMonths.includes(mk)) return;
      const key = `${s.store}_${s.product_code}`;
      salesMap.set(key, (salesMap.get(key) || 0) + Number(s.sales_value));
    });

    // Calcular dias de estoque
    const results: Array<{
      store: string;
      product_code: string;
      product_description: string;
      stock_value: number;
      avg_monthly_sales: number;
      days_of_stock: number;
    }> = [];

    stockData.forEach((stock) => {
      const key = `${stock.store}_${stock.product_code}`;
      const totalSales = salesMap.get(key) || 0;
      const avgMonthlySales = totalSales / avgMonths;
      const dailySales = avgMonthlySales / 30;
      const daysOfStock = dailySales > 0 ? Math.round(stock.stock_value / dailySales) : 9999;

      if (daysOfStock >= minDays) {
        results.push({
          store: stock.store,
          product_code: stock.product_code,
          product_description: stock.product_description,
          stock_value: stock.stock_value,
          avg_monthly_sales: avgMonthlySales,
          days_of_stock: daysOfStock,
        });
      }
    });

    return results.sort((a, b) => b.days_of_stock - a.days_of_stock);
  }, [stockData, salesData, avgMonths, minDays]);

  const stores = useMemo(() => {
    const s = new Set(productsWithDays.map((p) => p.store));
    return Array.from(s).sort();
  }, [productsWithDays]);

  const filteredByStore = useMemo(() => {
    if (selectedStore === "all") return productsWithDays;
    return productsWithDays.filter((p) => p.store === selectedStore);
  }, [productsWithDays, selectedStore]);

  const groupedByStore = useMemo(() => {
    const map = new Map<string, typeof productsWithDays>();
    filteredByStore.forEach((p) => {
      const arr = map.get(p.store) || [];
      arr.push(p);
      map.set(p.store, arr);
    });
    return map;
  }, [filteredByStore]);

  const isLoading = loadingStock || loadingSales;

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getDaysColor = (days: number) => {
    if (days >= 180) return "bg-destructive text-destructive-foreground";
    if (days >= 90) return "bg-orange-500 text-white";
    if (days >= 60) return "bg-yellow-500 text-black";
    return "bg-accent text-accent-foreground";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              Dias de Estoque
            </h1>
            <p className="text-muted-foreground">
              Produtos com estoque acima do limite configurado
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Mínimo de dias</Label>
              <Input
                type="number"
                value={minDays}
                onChange={(e) => setMinDays(Number(e.target.value) || 0)}
                className="w-24"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Meses p/ média</Label>
              <Input
                type="number"
                value={avgMonths}
                onChange={(e) => setAvgMonths(Math.max(1, Number(e.target.value) || 1))}
                className="w-24"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loja</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s} value={s}>{STORE_LABELS[s] || `Loja ${s}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stockData.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">Nenhum estoque carregado</p>
              <p className="text-sm text-muted-foreground">
                Vá até a aba de Upload e anexe o arquivo de estoque atual
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              {filteredByStore.length} produtos com {minDays}+ dias de estoque
            </div>

            {Array.from(groupedByStore.entries()).map(([store, products]) => (
              <Card key={store} className="border-border bg-card shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {STORE_LABELS[store] || `Loja ${store}`}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({products.length} produtos)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((p) => (
                      <div
                        key={`${p.store}_${p.product_code}`}
                        className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-mono text-muted-foreground">{p.product_code}</p>
                          <Badge className={getDaysColor(p.days_of_stock)}>
                            {p.days_of_stock >= 9999 ? "Sem venda" : `${p.days_of_stock} dias`}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                          {p.product_description}
                        </p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Estoque: {formatCurrency(p.stock_value)}</span>
                          <span>Venda/mês: {formatCurrency(p.avg_monthly_sales)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </Layout>
  );
};

export default StockDays;
