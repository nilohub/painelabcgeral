import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
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
      quantity: number 
    }> = {};

    data.forEach((item) => {
      const key = item.product_code;
      if (!grouped[key]) {
        grouped[key] = {
          code: item.product_code,
          description: item.product_description,
          sales: 0,
          profit: 0,
          quantity: 0,
        };
      }
      grouped[key].sales += Number(item.sales_value);
      grouped[key].profit += Number(item.profit);
      grouped[key].quantity += Number(item.quantity);
    });

    return Object.values(grouped)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader>
        <CardTitle className="text-lg">Top 10 Produtos por Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Código</TableHead>
                <TableHead className="text-muted-foreground">Descrição</TableHead>
                <TableHead className="text-right text-muted-foreground">Qtd</TableHead>
                <TableHead className="text-right text-muted-foreground">Vendas</TableHead>
                <TableHead className="text-right text-muted-foreground">Lucro</TableHead>
                <TableHead className="text-right text-muted-foreground">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((product, index) => {
                const margin = product.sales > 0 ? (product.profit / product.sales) * 100 : 0;
                const isPositiveMargin = margin > 15;

                return (
                  <TableRow key={product.code} className="border-border">
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {product.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate font-medium">
                      {product.description}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(product.quantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-chart-sales">
                      {formatCurrency(product.sales)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-chart-profit">
                      {formatCurrency(product.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPositiveMargin ? (
                          <TrendingUp className="h-4 w-4 text-chart-profit" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span
                          className={`tabular-nums font-medium ${
                            isPositiveMargin ? "text-chart-profit" : "text-destructive"
                          }`}
                        >
                          {margin.toFixed(1)}%
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
