import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Package, TrendingUp, ShoppingCart, Target } from "lucide-react";
import type { DashboardStats } from "@/pages/Index";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const profitMargin = Number(stats.total_sales) > 0
    ? (Number(stats.total_profit) / Number(stats.total_sales)) * 100
    : 0;
  const ticketMedio = Number(stats.total_quantity) > 0
    ? Number(stats.total_sales) / Number(stats.total_quantity)
    : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("pt-BR").format(value);

  const cards = [
    {
      title: "Faturamento Total",
      value: formatCurrency(Number(stats.total_sales)),
      subtitle: `${stats.unique_stores} lojas`,
      icon: DollarSign,
      color: "text-chart-sales",
      bgColor: "bg-chart-sales/10",
      cssVar: "--chart-sales",
    },
    {
      title: "Lucro Total",
      value: formatCurrency(Number(stats.total_profit)),
      subtitle: `Margem: ${profitMargin.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-chart-profit",
      bgColor: "bg-chart-profit/10",
      cssVar: "--chart-profit",
    },
    {
      title: "Unidades Vendidas",
      value: formatNumber(Number(stats.total_quantity)),
      subtitle: `${stats.unique_products} produtos únicos`,
      icon: Package,
      color: "text-chart-quantity",
      bgColor: "bg-chart-quantity/10",
      cssVar: "--chart-quantity",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(ticketMedio),
      subtitle: "valor médio por unidade",
      icon: ShoppingCart,
      color: "text-chart-accent",
      bgColor: "bg-chart-accent/10",
      cssVar: "--chart-accent",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 animate-slide-up overflow-hidden border-l-4"
              style={{
                animationDelay: `${index * 80}ms`,
                borderLeftColor: `var(${stat.cssVar})`,
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                    <p className="mt-2 text-2xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats.top_product && (
        <Card className="border-border bg-gradient-to-r from-primary/5 to-accent/5 shadow-card animate-slide-up" style={{ animationDelay: '320ms' }}>
          <CardContent className="py-3 px-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Produto destaque:</span>
              <span className="font-semibold text-foreground truncate max-w-[300px]">{stats.top_product.desc}</span>
              <span className="text-primary font-bold">{formatCurrency(Number(stats.top_product.sales))}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
