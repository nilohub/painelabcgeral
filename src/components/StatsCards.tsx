import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Package, Percent } from "lucide-react";
import type { SalesData } from "@/pages/Index";

interface StatsCardsProps {
  data: SalesData[];
}

export function StatsCards({ data }: StatsCardsProps) {
  const totalSales = data.reduce((sum, item) => sum + Number(item.sales_value), 0);
  const totalProfit = data.reduce((sum, item) => sum + Number(item.profit), 0);
  const totalQuantity = data.reduce((sum, item) => sum + Number(item.quantity), 0);
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const uniqueProducts = new Set(data.map((item) => item.product_code)).size;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const stats = [
    {
      title: "Vendas Totais",
      value: formatCurrency(totalSales),
      icon: DollarSign,
      color: "text-chart-sales",
      bgColor: "bg-chart-sales/10",
    },
    {
      title: "Lucro Total",
      value: formatCurrency(totalProfit),
      icon: TrendingUp,
      color: "text-chart-profit",
      bgColor: "bg-chart-profit/10",
    },
    {
      title: "Unidades Vendidas",
      value: formatNumber(totalQuantity),
      icon: Package,
      color: "text-chart-quantity",
      bgColor: "bg-chart-quantity/10",
    },
    {
      title: "Margem de Lucro",
      value: `${profitMargin.toFixed(1)}%`,
      icon: Percent,
      color: "text-chart-accent",
      bgColor: "bg-chart-accent/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {uniqueProducts} produtos únicos
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
