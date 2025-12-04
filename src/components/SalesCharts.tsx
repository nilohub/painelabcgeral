import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import type { SalesData } from "@/pages/Index";

interface SalesChartsProps {
  data: SalesData[];
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Using CSS variables for consistent theming
const COLORS = {
  sales: "hsl(var(--chart-sales))",
  profit: "hsl(var(--chart-profit))",
  quantity: "hsl(var(--chart-quantity))",
  accent: "hsl(var(--chart-accent))"
};

const PIE_COLORS = [
  "hsl(var(--chart-sales))",
  "hsl(var(--chart-profit))",
  "hsl(var(--chart-quantity))",
  "hsl(var(--chart-accent))",
  "hsl(var(--destructive))",
  "hsl(var(--primary))"
];
export function SalesCharts({
  data
}: SalesChartsProps) {
  const monthlyData = useMemo(() => {
    const grouped: Record<number, {
      sales: number;
      profit: number;
      quantity: number;
    }> = {};
    data.forEach(item => {
      if (!grouped[item.month]) {
        grouped[item.month] = {
          sales: 0,
          profit: 0,
          quantity: 0
        };
      }
      grouped[item.month].sales += Number(item.sales_value);
      grouped[item.month].profit += Number(item.profit);
      grouped[item.month].quantity += Number(item.quantity);
    });
    return Array.from({
      length: 12
    }, (_, i) => ({
      month: MONTHS[i],
      monthNum: i + 1,
      sales: grouped[i + 1]?.sales || 0,
      profit: grouped[i + 1]?.profit || 0,
      quantity: grouped[i + 1]?.quantity || 0
    })).filter(item => item.sales > 0 || item.profit > 0 || item.quantity > 0);
  }, [data]);
  const storeData = useMemo(() => {
    const grouped: Record<string, {
      sales: number;
      profit: number;
      quantity: number;
    }> = {};
    data.forEach(item => {
      if (!grouped[item.store]) {
        grouped[item.store] = {
          sales: 0,
          profit: 0,
          quantity: 0
        };
      }
      grouped[item.store].sales += Number(item.sales_value);
      grouped[item.store].profit += Number(item.profit);
      grouped[item.store].quantity += Number(item.quantity);
    });
    return Object.entries(grouped).map(([store, values]) => ({
      name: `Loja ${store}`,
      ...values
    })).sort((a, b) => b.sales - a.sales);
  }, [data]);
  const subgroupData = useMemo(() => {
    const grouped: Record<string, number> = {};
    data.forEach(item => {
      if (!grouped[item.subgroup]) {
        grouped[item.subgroup] = 0;
      }
      grouped[item.subgroup] += Number(item.sales_value);
    });
    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [data]);
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
    return `R$ ${value.toFixed(0)}`;
  };
  const formatTooltipCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };
  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      return <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="mb-2 font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => <p key={index} className="text-sm" style={{
          color: entry.color
        }}>
              {entry.name}: {entry.name === "Quantidade" ? entry.value.toLocaleString("pt-BR") : formatTooltipCurrency(entry.value)}
            </p>)}
        </div>;
    }
    return null;
  };
  return <div className="grid gap-6 lg:grid-cols-2">
      {/* Vendas e Lucro por Mês */}
      <Card className="border-border bg-card shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Faturamento e Lucro por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.sales} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.sales} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.profit} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.profit} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="sales" name="Vendas" stroke={COLORS.sales} strokeWidth={2} fill="url(#salesGradient)" />
                <Area type="monotone" dataKey="profit" name="Lucro" stroke={COLORS.profit} strokeWidth={2} fill="url(#profitGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quantidade por Mês */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Unidades Vendidas por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="quantity" name="Quantidade" fill={COLORS.quantity} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vendas por Subgrupo */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Vendas por Subgrupo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subgroupData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {subgroupData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatTooltipCurrency(value)} contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo por Loja */}
      <Card className="border-border bg-card shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Comparativo de Faturamento x Lucro por Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="sales" name="Vendas" fill={COLORS.sales} radius={[0, 4, 4, 0]} />
                <Bar dataKey="profit" name="Lucro" fill={COLORS.profit} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>;
}