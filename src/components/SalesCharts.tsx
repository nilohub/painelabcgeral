import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, Settings2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

const YEAR_COLORS = [
  { sales: "hsl(var(--chart-sales))", profit: "hsl(var(--chart-profit))", quantity: "hsl(var(--chart-quantity))" },
  { sales: "hsl(var(--chart-accent))", profit: "hsl(var(--primary))", quantity: "hsl(var(--destructive))" },
  { sales: "hsl(var(--muted-foreground))", profit: "hsl(var(--secondary-foreground))", quantity: "hsl(var(--accent-foreground))" },
];

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
  const availableYears = useMemo(() => {
    const years = [...new Set(data.map(d => d.year))].sort();
    return years;
  }, [data]);

  const monthlyData = useMemo(() => {
    const grouped: Record<string, Record<number, { sales: number; profit: number; quantity: number }>> = {};
    
    availableYears.forEach(year => {
      grouped[year] = {};
      for (let i = 1; i <= 12; i++) {
        grouped[year][i] = { sales: 0, profit: 0, quantity: 0 };
      }
    });
    
    data.forEach(item => {
      const monthKey = Number(item.month);
      const year = item.year;
      if (monthKey >= 1 && monthKey <= 12 && grouped[year]) {
        grouped[year][monthKey].sales += Number(item.sales_value) || 0;
        grouped[year][monthKey].profit += Number(item.profit) || 0;
        grouped[year][monthKey].quantity += Number(item.quantity) || 0;
      }
    });
    
    return Array.from({ length: 12 }, (_, i) => {
      const row: any = { month: MONTHS[i], monthNum: i + 1 };
      availableYears.forEach(year => {
        row[`sales_${year}`] = grouped[year][i + 1].sales;
        row[`profit_${year}`] = grouped[year][i + 1].profit;
        row[`quantity_${year}`] = grouped[year][i + 1].quantity;
      });
      return row;
    });
  }, [data, availableYears]);
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

  // Análise Pareto (80/20) - produtos que representam 80% das vendas
  const paretoData = useMemo(() => {
    const productSales: Record<string, { name: string; sales: number }> = {};
    data.forEach(item => {
      const key = item.product_code;
      if (!productSales[key]) {
        productSales[key] = { name: item.product_description.substring(0, 30), sales: 0 };
      }
      productSales[key].sales += Number(item.sales_value);
    });
    
    const sorted = Object.values(productSales).sort((a, b) => b.sales - a.sales);
    const totalSales = sorted.reduce((sum, p) => sum + p.sales, 0);
    
    let cumulative = 0;
    return sorted.slice(0, 15).map(product => {
      cumulative += product.sales;
      return {
        name: product.name,
        sales: product.sales,
        percentual: (product.sales / totalSales) * 100,
        cumulativo: (cumulative / totalSales) * 100
      };
    });
  }, [data]);

  // Margem de Lucro por Subgrupo
  const marginBySubgroupData = useMemo(() => {
    const grouped: Record<string, { sales: number; profit: number }> = {};
    data.forEach(item => {
      if (!grouped[item.subgroup]) {
        grouped[item.subgroup] = { sales: 0, profit: 0 };
      }
      grouped[item.subgroup].sales += Number(item.sales_value);
      grouped[item.subgroup].profit += Number(item.profit);
    });
    return Object.entries(grouped).map(([name, values]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      fullName: name,
      margin: values.sales > 0 ? (values.profit / values.sales) * 100 : 0,
      sales: values.sales,
      profit: values.profit
    })).sort((a, b) => b.margin - a.margin);
  }, [data]);

  // BCG Matrix customization state
  const [bcgSettingsOpen, setBcgSettingsOpen] = useState(false);
  const [customMarginThreshold, setCustomMarginThreshold] = useState<number | null>(null);
  const [customSalesThreshold, setCustomSalesThreshold] = useState<number | null>(null);

  // Matriz BCG de Produtos (Volume x Margem)
  const bcgMatrixData = useMemo(() => {
    const productData: Record<string, { name: string; code: string; sales: number; profit: number; quantity: number }> = {};
    data.forEach(item => {
      const key = item.product_code;
      if (!productData[key]) {
        productData[key] = { 
          name: item.product_description.substring(0, 25), 
          code: item.product_code,
          sales: 0, 
          profit: 0, 
          quantity: 0 
        };
      }
      productData[key].sales += Number(item.sales_value);
      productData[key].profit += Number(item.profit);
      productData[key].quantity += Number(item.quantity);
    });
    
    const products = Object.values(productData).map(p => ({
      ...p,
      margin: p.sales > 0 ? (p.profit / p.sales) * 100 : 0
    }));
    
    const calculatedAvgMargin = products.length > 0 ? products.reduce((sum, p) => sum + p.margin, 0) / products.length : 0;
    const calculatedAvgSales = products.length > 0 ? products.reduce((sum, p) => sum + p.sales, 0) / products.length : 0;
    const maxSales = Math.max(...products.map(p => p.sales), 1);
    const maxMargin = Math.max(...products.map(p => p.margin), 1);
    
    const marginThreshold = customMarginThreshold ?? calculatedAvgMargin;
    const salesThreshold = customSalesThreshold ?? calculatedAvgSales;
    
    return {
      products: products.slice(0, 50).map(p => ({
        ...p,
        quadrant: p.margin >= marginThreshold 
          ? (p.sales >= salesThreshold ? 'Estrela' : 'Interrogação')
          : (p.sales >= salesThreshold ? 'Vaca Leiteira' : 'Abacaxi')
      })),
      avgMargin: calculatedAvgMargin,
      avgSales: calculatedAvgSales,
      marginThreshold,
      salesThreshold,
      maxSales,
      maxMargin
    };
  }, [data, customMarginThreshold, customSalesThreshold]);

  // Ticket Médio por Loja e Subgrupo
  const ticketMedioData = useMemo(() => {
    const byStore: Record<string, { sales: number; quantity: number }> = {};
    const bySubgroup: Record<string, { sales: number; quantity: number }> = {};
    
    data.forEach(item => {
      // Por loja
      if (!byStore[item.store]) {
        byStore[item.store] = { sales: 0, quantity: 0 };
      }
      byStore[item.store].sales += Number(item.sales_value);
      byStore[item.store].quantity += Number(item.quantity);
      
      // Por subgrupo
      if (!bySubgroup[item.subgroup]) {
        bySubgroup[item.subgroup] = { sales: 0, quantity: 0 };
      }
      bySubgroup[item.subgroup].sales += Number(item.sales_value);
      bySubgroup[item.subgroup].quantity += Number(item.quantity);
    });
    
    return {
      byStore: Object.entries(byStore).map(([store, v]) => ({
        name: `Loja ${store}`,
        ticketMedio: v.quantity > 0 ? v.sales / v.quantity : 0,
        sales: v.sales,
        quantity: v.quantity
      })).sort((a, b) => b.ticketMedio - a.ticketMedio),
      bySubgroup: Object.entries(bySubgroup).map(([name, v]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        ticketMedio: v.quantity > 0 ? v.sales / v.quantity : 0,
        sales: v.sales,
        quantity: v.quantity
      })).sort((a, b) => b.ticketMedio - a.ticketMedio).slice(0, 10)
    };
  }, [data]);

  // Produtos em Alta/Queda (comparando meses)
  const trendingProductsData = useMemo(() => {
    const monthlyProductSales: Record<string, Record<number, number>> = {};
    
    data.forEach(item => {
      const key = item.product_code;
      const month = Number(item.month);
      if (!monthlyProductSales[key]) {
        monthlyProductSales[key] = {};
      }
      if (!monthlyProductSales[key][month]) {
        monthlyProductSales[key][month] = 0;
      }
      monthlyProductSales[key][month] += Number(item.sales_value);
    });
    
    const productTrends = Object.entries(monthlyProductSales).map(([code, months]) => {
      const monthValues = Object.entries(months)
        .map(([m, v]) => ({ month: Number(m), value: v }))
        .sort((a, b) => a.month - b.month);
      
      if (monthValues.length < 2) {
        return null;
      }
      
      // Calcular tendência usando os últimos meses disponíveis
      const recentMonths = monthValues.slice(-3);
      const firstValue = recentMonths[0]?.value || 0;
      const lastValue = recentMonths[recentMonths.length - 1]?.value || 0;
      const growth = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
      const totalSales = monthValues.reduce((sum, m) => sum + m.value, 0);
      
      const productInfo = data.find(d => d.product_code === code);
      
      return {
        code,
        name: productInfo?.product_description.substring(0, 30) || code,
        growth,
        totalSales,
        trend: growth > 10 ? 'up' : growth < -10 ? 'down' : 'stable'
      };
    }).filter(Boolean) as { code: string; name: string; growth: number; totalSales: number; trend: string }[];
    
    const sorted = productTrends.sort((a, b) => Math.abs(b.growth) - Math.abs(a.growth));
    
    return {
      rising: sorted.filter(p => p.trend === 'up').slice(0, 5),
      falling: sorted.filter(p => p.trend === 'down').slice(0, 5)
    };
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
                  {availableYears.map((year, yi) => (
                    <React.Fragment key={year}>
                      <linearGradient id={`salesGradient_${year}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={YEAR_COLORS[yi % YEAR_COLORS.length].sales} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={YEAR_COLORS[yi % YEAR_COLORS.length].sales} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id={`profitGradient_${year}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={YEAR_COLORS[yi % YEAR_COLORS.length].profit} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={YEAR_COLORS[yi % YEAR_COLORS.length].profit} stopOpacity={0} />
                      </linearGradient>
                    </React.Fragment>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                <Tooltip content={<MonthlyGrowthTooltip />} />
                <Legend />
                {availableYears.map((year, yi) => (
                  <React.Fragment key={year}>
                    <Area type="monotone" dataKey={`sales_${year}`} name={`Vendas ${year}`} stroke={YEAR_COLORS[yi % YEAR_COLORS.length].sales} strokeWidth={2} fill={`url(#salesGradient_${year})`} />
                    <Area type="monotone" dataKey={`profit_${year}`} name={`Lucro ${year}`} stroke={YEAR_COLORS[yi % YEAR_COLORS.length].profit} strokeWidth={2} fill={`url(#profitGradient_${year})`} />
                  </React.Fragment>
                ))}
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
                <Legend />
                {availableYears.map((year, yi) => (
                  <Bar key={year} dataKey={`quantity_${year}`} name={`Qtd ${year}`} fill={YEAR_COLORS[yi % YEAR_COLORS.length].quantity} radius={[4, 4, 0, 0]} />
                ))}
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

      {/* Análise Pareto (80/20) */}
      <Card className="border-border bg-card shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Análise Pareto - Top 15 Produtos (Curva ABC)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paretoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={150} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                          <p className="font-medium text-foreground mb-1">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Vendas: {formatTooltipCurrency(data.sales)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            % do Total: {data.percentual.toFixed(1)}%
                          </p>
                          <p className="text-sm font-medium" style={{ color: COLORS.accent }}>
                            Acumulado: {data.cumulativo.toFixed(1)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="sales" name="Vendas" fill={COLORS.sales} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Identifica os produtos que mais contribuem para o faturamento total
          </p>
        </CardContent>
      </Card>

      {/* Margem de Lucro por Subgrupo */}
      <Card className="border-border bg-card shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Margem de Lucro por Subgrupo (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginBySubgroupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                          <p className="font-medium text-foreground mb-1">{data.fullName}</p>
                          <p className="text-sm" style={{ color: COLORS.profit }}>
                            Margem: {data.margin.toFixed(1)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Vendas: {formatTooltipCurrency(data.sales)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Lucro: {formatTooltipCurrency(data.profit)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="margin" name="Margem %" fill={COLORS.profit} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Compara a rentabilidade (lucro/vendas) entre os diferentes subgrupos de produtos
          </p>
        </CardContent>
      </Card>

      {/* Matriz BCG de Produtos */}
      <Card className="border-border bg-card shadow-card lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Matriz BCG - Volume x Margem de Lucro</CardTitle>
          <Collapsible open={bcgSettingsOpen} onOpenChange={setBcgSettingsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Personalizar
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </CardHeader>
        <CardContent>
          <Collapsible open={bcgSettingsOpen} onOpenChange={setBcgSettingsOpen}>
            <CollapsibleContent className="mb-4 p-4 border border-border rounded-lg bg-muted/30">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Limite de Margem (%)</Label>
                    <span className="text-sm font-medium text-muted-foreground">
                      {(customMarginThreshold ?? bcgMatrixData.avgMargin).toFixed(1)}%
                    </span>
                  </div>
                  <Slider
                    value={[customMarginThreshold ?? bcgMatrixData.avgMargin]}
                    onValueChange={(value) => setCustomMarginThreshold(value[0])}
                    min={0}
                    max={Math.min(bcgMatrixData.maxMargin, 100)}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Média calculada: {bcgMatrixData.avgMargin.toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Limite de Vendas (R$)</Label>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatTooltipCurrency(customSalesThreshold ?? bcgMatrixData.avgSales)}
                    </span>
                  </div>
                  <Slider
                    value={[customSalesThreshold ?? bcgMatrixData.avgSales]}
                    onValueChange={(value) => setCustomSalesThreshold(value[0])}
                    min={0}
                    max={bcgMatrixData.maxSales}
                    step={bcgMatrixData.maxSales / 100}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Média calculada: {formatTooltipCurrency(bcgMatrixData.avgSales)}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setCustomMarginThreshold(null);
                    setCustomSalesThreshold(null);
                  }}
                  className="w-full"
                >
                  Restaurar Valores Padrão
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  dataKey="sales" 
                  name="Vendas" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={formatCurrency}
                  label={{ value: 'Volume de Vendas', position: 'bottom', offset: 0, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="margin" 
                  name="Margem" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  label={{ value: 'Margem %', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                />
                <ZAxis type="number" dataKey="quantity" range={[50, 400]} />
                <ReferenceLine x={bcgMatrixData.salesThreshold} stroke="hsl(var(--primary))" strokeDasharray="5 5" strokeWidth={2} />
                <ReferenceLine y={bcgMatrixData.marginThreshold} stroke="hsl(var(--primary))" strokeDasharray="5 5" strokeWidth={2} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                          <p className="font-medium text-foreground mb-1">{data.name}</p>
                          <p className="text-xs text-muted-foreground">Código: {data.code}</p>
                          <p className="text-sm" style={{ color: COLORS.sales }}>
                            Vendas: {formatTooltipCurrency(data.sales)}
                          </p>
                          <p className="text-sm" style={{ color: COLORS.profit }}>
                            Margem: {data.margin.toFixed(1)}%
                          </p>
                          <p className="text-sm font-medium mt-1" style={{ 
                            color: data.quadrant === 'Estrela' ? COLORS.profit : 
                                   data.quadrant === 'Vaca Leiteira' ? COLORS.sales :
                                   data.quadrant === 'Interrogação' ? COLORS.accent : 'hsl(var(--destructive))'
                          }}>
                            Quadrante: {data.quadrant}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  name="Produtos" 
                  data={bcgMatrixData.products} 
                  fill={COLORS.sales}
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    const color = payload.quadrant === 'Estrela' ? COLORS.profit : 
                                 payload.quadrant === 'Vaca Leiteira' ? COLORS.sales :
                                 payload.quadrant === 'Interrogação' ? COLORS.accent : 'hsl(var(--destructive))';
                    return <circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={0.7} stroke={color} />;
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.profit }}></span> Estrela</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.sales }}></span> Vaca Leiteira</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.accent }}></span> Interrogação</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-destructive"></span> Abacaxi</span>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Médio */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Ticket Médio por Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketMedioData.byStore} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={70} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                          <p className="font-medium text-foreground mb-1">{data.name}</p>
                          <p className="text-sm" style={{ color: COLORS.accent }}>
                            Ticket Médio: {formatTooltipCurrency(data.ticketMedio)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total Vendas: {formatTooltipCurrency(data.sales)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qtd. Vendida: {data.quantity.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="ticketMedio" name="Ticket Médio" fill={COLORS.accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Médio por Subgrupo */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Ticket Médio por Subgrupo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketMedioData.bySubgroup}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-45} textAnchor="end" height={70} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                          <p className="font-medium text-foreground mb-1">{data.fullName}</p>
                          <p className="text-sm" style={{ color: COLORS.quantity }}>
                            Ticket Médio: {formatTooltipCurrency(data.ticketMedio)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total Vendas: {formatTooltipCurrency(data.sales)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="ticketMedio" name="Ticket Médio" fill={COLORS.quantity} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Produtos em Alta/Queda */}
      <Card className="border-border bg-card shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Produtos em Tendência (Alta/Queda)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Produtos em Alta */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Em Alta
              </h4>
              <div className="space-y-2">
                {trendingProductsData.rising.length > 0 ? trendingProductsData.rising.map((product, index) => (
                  <div key={product.code} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatTooltipCurrency(product.totalSales)}</p>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-500 font-medium text-sm">
                      <TrendingUp className="w-4 h-4" />
                      +{product.growth.toFixed(0)}%
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Dados insuficientes para análise</p>
                )}
              </div>
            </div>

            {/* Produtos em Queda */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Em Queda
              </h4>
              <div className="space-y-2">
                {trendingProductsData.falling.length > 0 ? trendingProductsData.falling.map((product, index) => (
                  <div key={product.code} className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatTooltipCurrency(product.totalSales)}</p>
                    </div>
                    <div className="flex items-center gap-1 text-red-500 font-medium text-sm">
                      <TrendingDown className="w-4 h-4" />
                      {product.growth.toFixed(0)}%
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Dados insuficientes para análise</p>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Análise baseada na variação de vendas nos últimos meses disponíveis
          </p>
        </CardContent>
      </Card>
    </div>;
}