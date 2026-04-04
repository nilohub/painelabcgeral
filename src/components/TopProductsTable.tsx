import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Medal } from "lucide-react";
import type { SalesData } from "@/pages/Index";

interface TopProductsTableProps {
  data: SalesData[];
}

export function TopProductsTable({ data }: TopProductsTableProps) {
  const topProducts = useMemo(() => {
    const grouped: Record<string, {
      code: string;
      description: string;
      sales: number;
      profit: number;
      quantity: number;
    }> = {};

    data.forEach((item) => {
      const key = item.product_code;
      if (!grouped[key]) {
        grouped[key] = { code: item.product_code, description: item.product_description, sales: 0, profit: 0, quantity: 0 };
      }
      grouped[key].sales += Number(item.sales_value);
      grouped[key].profit += Number(item.profit);
      grouped[key].quantity += Number(item.quantity);
    });

    return Object.values(grouped).sort((a, b) => b.sales - a.sales).slice(0, 15);
  }, [data]);

  const totalSales = useMemo(() => data.reduce((sum, item) => sum + Number(item.sales_value), 0), [data]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("pt-BR").format(value);

  const getMedalColor = (index: number) => {
    if (index === 0) return "text-yellow-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-amber-700";
    return "text-muted-foreground";
  };

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Medal className="h-5 w-5 text-chart-accent" />
          Top 15 Produtos por Faturamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-12">#</TableHead>
                <TableHead className="text-muted-foreground">Código</TableHead>
                <TableHead className="text-muted-foreground">Descrição</TableHead>
                <TableHead className="text-right text-muted-foreground">Qtd</TableHead>
                <TableHead className="text-right text-muted-foreground">Vendas</TableHead>
                <TableHead className="text-right text-muted-foreground">Lucro</TableHead>
                <TableHead className="text-right text-muted-foreground">Margem</TableHead>
                <TableHead className="text-right text-muted-foreground">% Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((product, index) => {
                const margin = product.sales > 0 ? (product.profit / product.sales) * 100 : 0;
                const shareOfTotal = totalSales > 0 ? (product.sales / totalSales) * 100 : 0;
                const isPositiveMargin = margin > 15;

                return (
                  <TableRow key={product.code} className="border-border group hover:bg-muted/50 transition-colors">
                    <TableCell>
                      {index < 3 ? (
                        <Medal className={`h-4 w-4 ${getMedalColor(index)}`} />
                      ) : (
                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {product.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate font-medium text-sm">
                      {product.description}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatNumber(product.quantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-sm text-chart-sales">
                      {formatCurrency(product.sales)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-sm text-chart-profit">
                      {formatCurrency(product.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPositiveMargin ? (
                          <TrendingUp className="h-3.5 w-3.5 text-chart-profit" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={`tabular-nums font-medium text-sm ${isPositiveMargin ? "text-chart-profit" : "text-destructive"}`}>
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${Math.min(shareOfTotal * 5, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                          {shareOfTotal.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
