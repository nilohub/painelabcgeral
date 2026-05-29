import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Filter, X, FileWarning } from "lucide-react";

interface TrendRow {
  product_code: string;
  product_description: string;
  first_period_label: string;
  second_period_label: string;
  first_period_sales: number;
  second_period_sales: number;
  first_period_profit: number;
  second_period_profit: number;
  sales_delta_pct: number | null;
  profit_delta_pct: number | null;
}

const MONTHS = [
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const fmtBRL = (v: number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const Trends = () => {
  const [tab, setTab] = useState<"up" | "down">("up");
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [subgroup, setSubgroup] = useState("all");
  const [stores, setStores] = useState<string[]>([]);
  const [options, setOptions] = useState({
    years: [] as string[],
    stores: [] as string[],
    subgroups: [] as string[],
  });
  const [rising, setRising] = useState<TrendRow[]>([]);
  const [declining, setDeclining] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: opts } = await supabase.rpc("get_filter_options");
      if (opts) {
        const o = opts as { years: number[]; stores: string[]; subgroups: string[] };
        setOptions({
          years: (o.years || []).map(String),
          stores: o.stores || [],
          subgroups: o.subgroups || [],
        });
      }
    })();
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const params = {
        p_year: year !== "all" ? parseInt(year) : null,
        p_month: month !== "all" ? parseInt(month) : null,
        p_stores: stores.length > 0 ? stores : null,
        p_subgroup: subgroup !== "all" ? subgroup : null,
      };
      const [r, d] = await Promise.all([
        supabase.rpc("get_rising_products", params),
        supabase.rpc("get_declining_products", params),
      ]);
      setRising((r.data || []) as TrendRow[]);
      setDeclining((d.data || []) as TrendRow[]);
      setLoading(false);
    };
    fetchAll();
  }, [year, month, stores, subgroup]);

  const toggleStore = (s: string) => {
    setStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const storesLabel =
    stores.length === 0
      ? "Todas as Lojas"
      : stores.length <= 3
        ? stores.map((s) => `Loja ${s}`).join(", ")
        : `${stores.length} lojas`;

  const renderTable = (rows: TrendRow[], direction: "up" | "down") => {
    if (loading) {
      return (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
          <FileWarning className="h-8 w-8" />
          <p className="text-sm">Nenhum produto encontrado com os filtros aplicados.</p>
        </div>
      );
    }
    const period = `${rows[0].first_period_label} → ${rows[0].second_period_label}`;
    return (
      <>
        <div className="mb-2 text-xs text-muted-foreground">Comparativo: {period}</div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Fat. 1º</TableHead>
                <TableHead className="text-right">Fat. 2º</TableHead>
                <TableHead className="text-right">Δ Fat.</TableHead>
                <TableHead className="text-right">Lucro 1º</TableHead>
                <TableHead className="text-right">Lucro 2º</TableHead>
                <TableHead className="text-right">Δ Lucro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.product_code}>
                  <TableCell className="font-mono text-xs">{r.product_code}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.product_description}</TableCell>
                  <TableCell className="text-right">{fmtBRL(r.first_period_sales)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(r.second_period_sales)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={direction === "up" ? "default" : "destructive"}>
                      {r.sales_delta_pct !== null ? `${r.sales_delta_pct > 0 ? "+" : ""}${r.sales_delta_pct}%` : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{fmtBRL(r.first_period_profit)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(r.second_period_profit)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={direction === "up" ? "default" : "destructive"}>
                      {r.profit_delta_pct !== null ? `${r.profit_delta_pct > 0 ? "+" : ""}${r.profit_delta_pct}%` : "-"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tendências de Produtos</h1>
          <p className="text-muted-foreground text-sm">
            Produtos em alta e em queda (faturamento e lucro simultaneamente) comparando a primeira e a segunda metade do período filtrado.
          </p>
        </div>

        <Card className="shadow-card">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>

              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Anos</SelectItem>
                  {options.years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Meses</SelectItem>
                  {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-between text-sm font-normal">
                    <span className="truncate">{storesLabel}</span>
                    {stores.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {stores.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2" align="start">
                  <div className="space-y-1">
                    {stores.length > 0 && (
                      <button
                        onClick={() => setStores([])}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Limpar seleção
                      </button>
                    )}
                    {options.stores.map((s) => (
                      <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors">
                        <Checkbox checked={stores.includes(s)} onCheckedChange={() => toggleStore(s)} />
                        Loja {s}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={subgroup} onValueChange={setSubgroup}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Seção" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Seções</SelectItem>
                  {options.subgroups.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "up" | "down")}>
          <TabsList>
            <TabsTrigger value="up" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Em Alta {!loading && `(${rising.length})`}
            </TabsTrigger>
            <TabsTrigger value="down" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Em Queda {!loading && `(${declining.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="up">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Produtos em Alta
                </CardTitle>
              </CardHeader>
              <CardContent>{renderTable(rising, "up")}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="down">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  Produtos em Queda
                </CardTitle>
              </CardHeader>
              <CardContent>{renderTable(declining, "down")}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Trends;