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
  // Busca estoque para checar se há dados carregados
  const { data: stockCheck = [], isLoading: loadingStock } = useQuery({
    queryKey: ["stock-days", "stock-check"],
    queryFn: async () => {
      const { data, error } = await supabase.from("current_stock").select("id").limit(1);
      if (error) throw error;
      return data || [];
    },
  });

  // Busca tudo calculado via função do banco
  const { data: productsRaw = [], isLoading: loadingSales } = useQuery({
    queryKey: ["stock-days", "calculated", avgMonths, minDays],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_stock_days", {
        months_back: avgMonths,
        min_days: minDays,
      });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        store: r.store as string,
        product_code: r.product_code as string,
        product_description: r.product_description as string,
        stock_value: Number(r.stock_value),
        avg_monthly_sales: Number(r.avg_monthly_sales),
        days_of_stock: Number(r.days_of_stock),
      }));
    },
  });

  const productsWithDays = productsRaw;

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
        ) : stockCheck.length === 0 ? (
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
