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
    
    // Initialize all months with zero values
    for (let i = 1; i <= 12; i++) {
      grouped[i] = { sales: 0, profit: 0, quantity: 0 };
    }
    
    data.forEach(item => {
      const monthKey = Number(item.month);
      if (monthKey >= 1 && monthKey <= 12) {
        grouped[monthKey].sales += Number(item.sales_value) || 0;
        grouped[monthKey].profit += Number(item.profit) || 0;
        grouped[monthKey].quantity += Number(item.quantity) || 0;
      }
    });
    
    return Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS[i],
      monthNum: i + 1,
      sales: grouped[i + 1].sales,
      profit: grouped[i + 1].profit,
      quantity: grouped[i + 1].quantity
    }));
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
  const getGrowthAnalysis = (currentMonth: number, salesGrowth: number, profitGrowth: number) => {
    const monthName = MONTHS[currentMonth - 1];
    
    if (currentMonth === 1) {
      return "Janeiro é o primeiro mês do período, sem dados anteriores para comparação.";
    }

    const salesTrend = salesGrowth >= 0 ? "crescimento" : "queda";
    const profitTrend = profitGrowth >= 0 ? "crescimento" : "queda";
    const salesAbs = Math.abs(salesGrowth).toFixed(1);
    const profitAbs = Math.abs(profitGrowth).toFixed(1);

    if (salesGrowth >= 0 && profitGrowth >= 0) {
      return `${monthName} apresentou ${salesTrend} de ${salesAbs}% no faturamento e ${profitTrend} de ${profitAbs}% no lucro em relação ao mês anterior, indicando bom desempenho geral.`;
    } else if (salesGrowth >= 0 && profitGrowth < 0) {
      return `${monthName} apresentou ${salesTrend} de ${salesAbs}% no faturamento, porém ${profitTrend} de ${profitAbs}% no lucro, indicando possível impacto de precificação, aumento de custos ou promoções agressivas.`;
    } else if (salesGrowth < 0 && profitGrowth >= 0) {
      return `${monthName} apresentou ${salesTrend} de ${salesAbs}% no faturamento, mas ${profitTrend} de ${profitAbs}% no lucro, indicando melhor margem ou mix de produtos mais rentáveis.`;
    } else {
      return `${monthName} apresentou ${salesTrend} de ${salesAbs}% no faturamento e ${profitTrend} de ${profitAbs}% no lucro, indicando necessidade de revisão de estratégia comercial ou possível sazonalidade.`;
    }
  };

  const MonthlyGrowthTooltip = ({
    active,
    payload,
    label
  }: any) => {
    if (active && payload && payload.length) {
      const currentMonthData = payload[0]?.payload;
      const currentMonthNum = currentMonthData?.monthNum;
      
      let salesGrowth = 0;
      let profitGrowth = 0;
      
      if (currentMonthNum > 1) {
        const prevMonthData = monthlyData[currentMonthNum - 2];
        const currentSales = currentMonthData?.sales || 0;
        const prevSales = prevMonthData?.sales || 0;
        const currentProfit = currentMonthData?.profit || 0;
        const prevProfit = prevMonthData?.profit || 0;
        
        salesGrowth = prevSales > 0 ? ((currentSales - prevSales) / prevSales) * 100 : 0;
        profitGrowth = prevProfit > 0 ? ((currentProfit - prevProfit) / prevProfit) * 100 : 0;
      }

      const analysis = getGrowthAnalysis(currentMonthNum, salesGrowth, profitGrowth);

      return (
        <div className="rounded-lg border border-border bg-card p-4 shadow-lg max-w-sm">
          <p className="mb-2 font-semibold text-foreground text-base">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatTooltipCurrency(entry.value)}
            </p>
          ))}
          
          {currentMonthNum > 1 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex gap-4 mb-2">
                <span className={`text-xs font-medium ${salesGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  Faturamento: {salesGrowth >= 0 ? '↑' : '↓'} {Math.abs(salesGrowth).toFixed(1)}%
                </span>
                <span className={`text-xs font-medium ${profitGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  Lucro: {profitGrowth >= 0 ? '↑' : '↓'} {Math.abs(profitGrowth).toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{analysis}</p>
            </div>
          )}
          
          {currentMonthNum === 1 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">{analysis}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
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
                <Tooltip content={<MonthlyGrowthTooltip />} />
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