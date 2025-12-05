import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { SalesData } from "@/pages/Index";

interface AdvancedAnalyticsProps {
  data: SalesData[];
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const COLORS = {
  sales: "hsl(var(--chart-sales))",
  profit: "hsl(var(--chart-profit))",
  quantity: "hsl(var(--chart-quantity))",
  accent: "hsl(var(--chart-accent))",
  primary: "hsl(var(--primary))",
  destructive: "hsl(var(--destructive))",
};

export function AdvancedAnalytics({ data }: AdvancedAnalyticsProps) {
  // Análise de crescimento mensal
  const growthAnalysis = useMemo(() => {
    const monthlyData: Record<number, { sales: number; profit: number; quantity: number }> = {};
    
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { sales: 0, profit: 0, quantity: 0 };
    }
    
    data.forEach((item) => {
      const month = Number(item.month);
      if (month >= 1 && month <= 12) {
        monthlyData[month].sales += Number(item.sales_value) || 0;
        monthlyData[month].profit += Number(item.profit) || 0;
        monthlyData[month].quantity += Number(item.quantity) || 0;
      }
    });

    const result = [];
    for (let i = 1; i <= 12; i++) {
      const current = monthlyData[i];
      const previous = i > 1 ? monthlyData[i - 1] : null;
      
      const salesGrowth = previous && previous.sales > 0 
        ? ((current.sales - previous.sales) / previous.sales) * 100 
        : 0;
      const profitGrowth = previous && previous.profit > 0 
        ? ((current.profit - previous.profit) / previous.profit) * 100 
        : 0;
      
      result.push({
        month: MONTHS[i - 1],
        monthNum: i,
        sales: current.sales,
        profit: current.profit,
        quantity: current.quantity,
        salesGrowth: Number(salesGrowth.toFixed(1)),
        profitGrowth: Number(profitGrowth.toFixed(1)),
      });
    }
    
    return result;
  }, [data]);

  // Análise de Pareto (80/20)
  const paretoAnalysis = useMemo(() => {
    const productSales: Record<string, { code: string; description: string; sales: number }> = {};
    
    data.forEach((item) => {
      const key = item.product_code;
      if (!productSales[key]) {
        productSales[key] = {
          code: item.product_code,
          description: item.product_description,
          sales: 0,
        };
      }
      productSales[key].sales += Number(item.sales_value) || 0;
    });

    const sorted = Object.values(productSales).sort((a, b) => b.sales - a.sales);
    const totalSales = sorted.reduce((sum, p) => sum + p.sales, 0);
    
    let cumulative = 0;
    const paretoData = sorted.slice(0, 20).map((product, index) => {
      cumulative += product.sales;
      return {
        ...product,
        rank: index + 1,
        percentage: (product.sales / totalSales) * 100,
        cumulative: (cumulative / totalSales) * 100,
      };
    });

    const productsFor80 = paretoData.findIndex((p) => p.cumulative >= 80) + 1;
    
    return {
      data: paretoData,
      productsFor80Percent: productsFor80 || paretoData.length,
      totalProducts: sorted.length,
    };
  }, [data]);

  // Análise de performance por loja
  const storePerformance = useMemo(() => {
    const storeData: Record<string, { sales: number; profit: number; quantity: number; products: Set<string> }> = {};
    
    data.forEach((item) => {
      if (!storeData[item.store]) {
        storeData[item.store] = { sales: 0, profit: 0, quantity: 0, products: new Set() };
      }
      storeData[item.store].sales += Number(item.sales_value) || 0;
      storeData[item.store].profit += Number(item.profit) || 0;
      storeData[item.store].quantity += Number(item.quantity) || 0;
      storeData[item.store].products.add(item.product_code);
    });

    const totalSales = Object.values(storeData).reduce((sum, s) => sum + s.sales, 0);
    const avgMargin = totalSales > 0 
      ? (Object.values(storeData).reduce((sum, s) => sum + s.profit, 0) / totalSales) * 100 
      : 0;

    return Object.entries(storeData)
      .map(([store, values]) => ({
        store: `Loja ${store}`,
        storeCode: store,
        sales: values.sales,
        profit: values.profit,
        quantity: values.quantity,
        margin: values.sales > 0 ? (values.profit / values.sales) * 100 : 0,
        avgMargin,
        productCount: values.products.size,
        ticketMedio: values.quantity > 0 ? values.sales / values.quantity : 0,
        contribution: totalSales > 0 ? (values.sales / totalSales) * 100 : 0,
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [data]);

  // Análise de subgrupos com métricas
  const subgroupMetrics = useMemo(() => {
    const subgroupData: Record<string, { sales: number; profit: number; quantity: number }> = {};
    
    data.forEach((item) => {
      if (!subgroupData[item.subgroup]) {
        subgroupData[item.subgroup] = { sales: 0, profit: 0, quantity: 0 };
      }
      subgroupData[item.subgroup].sales += Number(item.sales_value) || 0;
      subgroupData[item.subgroup].profit += Number(item.profit) || 0;
      subgroupData[item.subgroup].quantity += Number(item.quantity) || 0;
    });

    const totalSales = Object.values(subgroupData).reduce((sum, s) => sum + s.sales, 0);

    return Object.entries(subgroupData)
      .map(([name, values]) => ({
        name,
        sales: values.sales,
        profit: values.profit,
        quantity: values.quantity,
        margin: values.sales > 0 ? (values.profit / values.sales) * 100 : 0,
        contribution: totalSales > 0 ? (values.sales / totalSales) * 100 : 0,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }, [data]);

  // KPIs Gerais
  const kpis = useMemo(() => {
    const totalSales = data.reduce((sum, item) => sum + (Number(item.sales_value) || 0), 0);
    const totalProfit = data.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);
    const totalQuantity = data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const uniqueProducts = new Set(data.map((d) => d.product_code)).size;
    const uniqueStores = new Set(data.map((d) => d.store)).size;
    
    const avgTicket = totalQuantity > 0 ? totalSales / totalQuantity : 0;
    const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    const salesPerProduct = uniqueProducts > 0 ? totalSales / uniqueProducts : 0;
    const salesPerStore = uniqueStores > 0 ? totalSales / uniqueStores : 0;

    // Identificar mês com melhor e pior performance
    const monthlyTotals = growthAnalysis.filter((m) => m.sales > 0);
    const bestMonth = monthlyTotals.reduce((best, m) => (m.sales > best.sales ? m : best), monthlyTotals[0] || { month: "-", sales: 0 });
    const worstMonth = monthlyTotals.reduce((worst, m) => (m.sales < worst.sales ? m : worst), monthlyTotals[0] || { month: "-", sales: 0 });

    return {
      avgTicket,
      avgMargin,
      salesPerProduct,
      salesPerStore,
      bestMonth,
      worstMonth,
      totalProducts: uniqueProducts,
      totalStores: uniqueStores,
    };
  }, [data, growthAnalysis]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="mb-2 font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{" "}
              {entry.name.includes("Crescimento") || entry.name.includes("%")
                ? `${entry.value.toFixed(1)}%`
                : entry.name === "Quantidade"
                ? entry.value.toLocaleString("pt-BR")
                : formatFullCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Análises Avançadas</h2>
          <p className="text-sm text-muted-foreground">Métricas técnicas e insights estratégicos</p>
        </div>
      </div>

      {/* KPIs Avançados */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Ticket Médio</p>
                <p className="mt-1 text-xl font-bold text-foreground">{formatFullCurrency(kpis.avgTicket)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-sales/10">
                <Target className="h-5 w-5 text-chart-sales" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">por unidade vendida</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Vendas/Produto</p>
                <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(kpis.salesPerProduct)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-profit/10">
                <BarChart3 className="h-5 w-5 text-chart-profit" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{kpis.totalProducts} produtos únicos</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Melhor Mês</p>
                <p className="mt-1 text-xl font-bold text-chart-profit">{kpis.bestMonth?.month || "-"}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-profit/10">
                <TrendingUp className="h-5 w-5 text-chart-profit" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{formatCurrency(kpis.bestMonth?.sales || 0)}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Mês com Menor Venda</p>
                <p className="mt-1 text-xl font-bold text-chart-accent">{kpis.worstMonth?.month || "-"}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-accent/10">
                <AlertTriangle className="h-5 w-5 text-chart-accent" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{formatCurrency(kpis.worstMonth?.sales || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Crescimento Mensal */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-chart-accent" />
            <CardTitle className="text-lg">Análise de Crescimento Mensal</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={growthAnalysis}>
                <defs>
                  <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.sales} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.sales} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine yAxisId="right" y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Area yAxisId="left" type="monotone" dataKey="sales" name="Vendas" fill="url(#salesAreaGradient)" stroke={COLORS.sales} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="salesGrowth" name="Crescimento Vendas %" stroke={COLORS.profit} strokeWidth={2} dot={{ fill: COLORS.profit, r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Análise de Pareto */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-chart-quantity" />
                <CardTitle className="text-lg">Análise de Pareto (80/20)</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-chart-quantity/10 text-chart-quantity">
                {paretoAnalysis.productsFor80Percent} produtos = 80%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-chart-profit" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{paretoAnalysis.productsFor80Percent}</strong> de{" "}
                  <strong className="text-foreground">{paretoAnalysis.totalProducts}</strong> produtos representam 80% das vendas
                </span>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoAnalysis.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="rank" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine yAxisId="right" y={80} stroke={COLORS.destructive} strokeDasharray="5 5" label={{ value: "80%", fill: COLORS.destructive, fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="sales" name="Vendas" radius={[4, 4, 0, 0]}>
                    {paretoAnalysis.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cumulative <= 80 ? COLORS.sales : "hsl(var(--muted-foreground))"} fillOpacity={entry.cumulative <= 80 ? 1 : 0.3} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Acumulado %" stroke={COLORS.accent} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance por Loja */}
        <Card className="border-border bg-card shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-chart-sales" />
              <CardTitle className="text-lg">Performance por Loja</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storePerformance.slice(0, 6).map((store, index) => (
                <div key={store.storeCode} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <span className="font-medium text-foreground">{store.store}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(store.sales)}</span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          store.margin >= store.avgMargin
                            ? "bg-chart-profit/10 text-chart-profit"
                            : "bg-chart-accent/10 text-chart-accent"
                        }`}
                      >
                        {store.margin.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={store.contribution} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{store.productCount} produtos</span>
                    <span>Ticket: {formatFullCurrency(store.ticketMedio)}</span>
                    <span>{store.contribution.toFixed(1)}% do total</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Subgrupo */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Análise de Rentabilidade por Subgrupo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  dataKey="sales"
                  name="Vendas"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                  label={{ value: "Vendas (R$)", position: "bottom", offset: 40, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  type="number"
                  dataKey="margin"
                  name="Margem"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  label={{ value: "Margem (%)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
                />
                <ZAxis type="number" dataKey="quantity" range={[100, 1000]} name="Quantidade" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                          <p className="mb-2 font-medium text-foreground">{data.name}</p>
                          <p className="text-sm text-muted-foreground">Vendas: {formatFullCurrency(data.sales)}</p>
                          <p className="text-sm text-muted-foreground">Lucro: {formatFullCurrency(data.profit)}</p>
                          <p className="text-sm text-muted-foreground">Margem: {data.margin.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">Quantidade: {data.quantity.toLocaleString("pt-BR")}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={kpis.avgMargin} stroke={COLORS.accent} strokeDasharray="5 5" label={{ value: `Média: ${kpis.avgMargin.toFixed(1)}%`, fill: COLORS.accent, fontSize: 11 }} />
                <Scatter name="Subgrupos" data={subgroupMetrics}>
                  {subgroupMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.margin >= kpis.avgMargin ? COLORS.profit : COLORS.accent} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-chart-profit" />
              <span className="text-muted-foreground">Acima da margem média</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-chart-accent" />
              <span className="text-muted-foreground">Abaixo da margem média</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tamanho = Volume vendido</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Subgrupos Table */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Ranking de Subgrupos por Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-xs font-medium text-muted-foreground">#</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground">Subgrupo</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Vendas</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Lucro</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Margem</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Contribuição</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {subgroupMetrics.map((subgroup, index) => (
                  <tr key={subgroup.name} className="border-b border-border/50 last:border-0">
                    <td className="py-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-foreground">{subgroup.name}</td>
                    <td className="py-3 text-right text-foreground">{formatFullCurrency(subgroup.sales)}</td>
                    <td className="py-3 text-right text-foreground">{formatFullCurrency(subgroup.profit)}</td>
                    <td className="py-3 text-right">
                      <span className={subgroup.margin >= kpis.avgMargin ? "text-chart-profit" : "text-chart-accent"}>
                        {subgroup.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-foreground">{subgroup.contribution.toFixed(1)}%</td>
                    <td className="py-3 text-right">
                      {subgroup.margin >= kpis.avgMargin ? (
                        <Badge className="bg-chart-profit/10 text-chart-profit">
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                          Rentável
                        </Badge>
                      ) : (
                        <Badge className="bg-chart-accent/10 text-chart-accent">
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                          Atenção
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
