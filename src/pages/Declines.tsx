import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { DashboardFilters } from "@/components/DashboardFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingDown, FileWarning } from "lucide-react";
import type { Filters } from "@/pages/Index";

interface DeclineRow {
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

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const Declines = () => {
  const [rows, setRows] = useState<DeclineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    year: "all",
    month: "all",
    stores: [],
    subgroup: "all",
  });
  const [availableFilters, setAvailableFilters] = useState({
    years: [] as string[],
    months: [] as string[],
    stores: [] as string[],
    subgroups: [] as string[],
  });

  useEffect(() => {
    (async () => {
      const { data: opts } = await supabase.rpc("get_filter_options");
      if (opts) {
        const o = opts as { years: number[]; months: number[]; stores: string[]; subgroups: string[] };
        setAvailableFilters({
          years: (o.years || []).map(String),
          months: (o.months || []).map(String),
          stores: o.stores || [],
          subgroups: o.subgroups || [],
        });
      }
    })();
  }, []);

  useEffect(() => {
    const fetchDeclines = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_declining_products", {
        p_year: filters.year !== "all" ? parseInt(filters.year) : null,
        p_month: filters.month !== "all" ? parseInt(filters.month) : null,
        p_stores: filters.stores.length > 0 ? filters.stores : null,
        p_subgroup: filters.subgroup !== "all" ? filters.subgroup : null,
      });
      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data || []) as DeclineRow[]);
      }
      setLoading(false);
    };
    fetchDeclines();
  }, [filters]);

  const handleFilterChange = (key: keyof Filters, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-destructive" />
            Produtos em Queda
          </h1>
          <p className="text-muted-foreground text-sm">
            Itens com queda simultânea de faturamento e lucro, comparando a primeira e a segunda metade do período filtrado.
          </p>
        </div>

        <DashboardFilters
          filters={filters}
          availableFilters={availableFilters}
          onFilterChange={handleFilterChange}
        />

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {loading ? "Calculando..." : `${rows.length} produto(s) em queda`}
            </CardTitle>
            {!loading && rows.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {rows[0].first_period_label} → {rows[0].second_period_label}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rows.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileWarning className="h-8 w-8" />
                <p className="text-sm">Nenhum produto em queda no período filtrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Fat. 1º período</TableHead>
                      <TableHead className="text-right">Fat. 2º período</TableHead>
                      <TableHead className="text-right">Δ Faturamento</TableHead>
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
                        <TableCell className="text-right">{fmtBRL(Number(r.first_period_sales))}</TableCell>
                        <TableCell className="text-right">{fmtBRL(Number(r.second_period_sales))}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">
                            {r.sales_delta_pct !== null ? `${r.sales_delta_pct}%` : "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{fmtBRL(Number(r.first_period_profit))}</TableCell>
                        <TableCell className="text-right">{fmtBRL(Number(r.second_period_profit))}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">
                            {r.profit_delta_pct !== null ? `${r.profit_delta_pct}%` : "-"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Declines;