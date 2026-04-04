import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, Settings2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { MonthlyChartRow, StoreChartRow, SubgroupChartRow, ProductRow, ProductTrendRow } from "@/pages/Index";

interface SalesChartsProps {
  monthlyData: MonthlyChartRow[];
  storeData: StoreChartRow[];
  subgroupData: SubgroupChartRow[];
  topProducts: ProductRow[];
  productTrends: ProductTrendRow[];
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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

export function SalesCharts({ monthlyData: rawMonthly, storeData: rawStore, subgroupData: rawSubgroup, topProducts, productTrends }: SalesChartsProps) {
  const availableYears = useMemo(() => {
    const years = [...new Set(rawMonthly.map(d => d.data_year))].sort();
    return years;
  }, [rawMonthly]);

  const monthlyData = useMemo(() => {
    const grouped: Record<number, Record<number, { sales: number; profit: number; quantity: number }>> = {};
    availableYears.forEach(year => {
      grouped[year] = {};
      for (let i = 1; i <= 12; i++) {
        grouped[year][i] = { sales: 0, profit: 0, quantity: 0 };
      }
    });
    rawMonthly.forEach(item => {
      if (grouped[item.data_year]?.[item.data_month]) {
        grouped[item.data_year][item.data_month] = {
          sales: Number(item.total_sales),
          profit: Number(item.total_profit),
          quantity: Number(item.total_quantity),
        };
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
  }, [rawMonthly, availableYears]);

  const storeData = useMemo(() => {
    return rawStore.map(s => ({
      name: `Loja ${s.store}`,
      sales: Number(s.total_sales),
      profit: Number(s.total_profit),
      quantity: Number(s.total_quantity),
    }));
  }, [rawStore]);

  const subgroupData = useMemo(() => {
    return rawSubgroup.slice(0, 6).map(s => ({
      name: s.subgroup,
      value: Number(s.total_sales),
    }));
  }, [rawSubgroup]);

  const paretoData = useMemo(() => {
    const totalSales = topProducts.reduce((sum, p) => sum + Number(p.total_sales), 0);
    let cumulative = 0;
    return topProducts.slice(0, 15).map(p => {
      const sales = Number(p.total_sales);
      cumulative += sales;
      return {
        name: p.product_description.substring(0, 30),
        sales,
        percentual: totalSales > 0 ? (sales / totalSales) * 100 : 0,
        cumulativo: totalSales > 0 ? (cumulative / totalSales) * 100 : 0,
      };
    });
  }, [topProducts]);

  const marginBySubgroupData = useMemo(() => {
    return rawSubgroup.map(s => {
      const sales = Number(s.total_sales);
      const profit = Number(s.total_profit);
      return {
        name: s.subgroup.length > 20 ? s.subgroup.substring(0, 20) + '...' : s.subgroup,
        fullName: s.subgroup,
        margin: sales > 0 ? (profit / sales) * 100 : 0,
        sales,
        profit,
      };
    }).sort((a, b) => b.margin - a.margin);
  }, [rawSubgroup]);

  const [bcgSettingsOpen, setBcgSettingsOpen] = useState(false);
  const [customMarginThreshold, setCustomMarginThreshold] = useState<number | null>(null);
  const [customSalesThreshold, setCustomSalesThreshold] = useState<number | null>(null);

  const bcgMatrixData = useMemo(() => {
    const products = topProducts.map(p => {
      const sales = Number(p.total_sales);
      const profit = Number(p.total_profit);
      return {
        name: p.product_description.substring(0, 25),
        code: p.product_code,
        sales,
        profit,
        quantity: Number(p.total_quantity),
        margin: sales > 0 ? (profit / sales) * 100 : 0,
      };
    });

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
  }, [topProducts, customMarginThreshold, customSalesThreshold]);

  const ticketMedioData = useMemo(() => ({
    byStore: rawStore.map(s => ({
      name: `Loja ${s.store}`,
      ticketMedio: Number(s.total_quantity) > 0 ? Number(s.total_sales) / Number(s.total_quantity) : 0,
      sales: Number(s.total_sales),
      quantity: Number(s.total_quantity),
    })).sort((a, b) => b.ticketMedio - a.ticketMedio),
    bySubgroup: rawSubgroup.map(s => ({
      name: s.subgroup.length > 15 ? s.subgroup.substring(0, 15) + '...' : s.subgroup,
      fullName: s.subgroup,
      ticketMedio: Number(s.total_quantity) > 0 ? Number(s.total_sales) / Number(s.total_quantity) : 0,
      sales: Number(s.total_sales),
      quantity: Number(s.total_quantity),
    })).sort((a, b) => b.ticketMedio - a.ticketMedio).slice(0, 10),
  }), [rawStore, rawSubgroup]);

  const trendingProductsData = useMemo(() => {
    const byProduct: Record<string, { name: string; months: Record<string, number>; totalSales: number }> = {};
    productTrends.forEach(row => {
      if (!byProduct[row.product_code]) {
        byProduct[row.product_code] = { name: row.product_description.substring(0, 30), months: {}, totalSales: 0 };
      }
      const key = `${row.data_year}-${row.data_month}`;
      byProduct[row.product_code].months[key] = (byProduct[row.product_code].months[key] || 0) + Number(row.total_sales);
      byProduct[row.product_code].totalSales += Number(row.total_sales);
    });

    const trends = Object.entries(byProduct).map(([code, data]) => {
      const monthKeys = Object.keys(data.months).sort();
      if (monthKeys.length < 2) return null;
      const recent = monthKeys.slice(-3);
      const firstVal = data.months[recent[0]] || 0;
      const lastVal = data.months[recent[recent.length - 1]] || 0;
      const growth = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;
      return {
        code,
        name: data.name,
        growth,
        totalSales: data.totalSales,
        trend: growth > 10 ? 'up' as const : growth < -10 ? 'down' as const : 'stable' as const,
      };
    }).filter(Boolean) as { code: string; name: string; growth: number; totalSales: number; trend: 'up' | 'down' | 'stable' }[];

    const sorted = trends.sort((a, b) => Math.abs(b.growth) - Math.abs(a.growth));
    return {
      rising: sorted.filter(p => p.trend === 'up').slice(0, 5),
      falling: sorted.filter(p => p.trend === 'down').slice(0, 5),
    };
  }, [productTrends]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  const formatTooltipCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const MonthlyGrowthTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthIndex = MONTHS.indexOf(label);
      const monthNum = monthIndex + 1;

      const yearData: Record<number, { sales: number; profit: number; margin: number }> = {};
      availableYears.forEach(year => {
        const salesEntry = payload.find((p: any) => p.dataKey === `sales_${year}`);
        const profitEntry = payload.find((p: any) => p.dataKey === `profit_${year}`);
        const sales = salesEntry?.value || 0;
        const profit = profitEntry?.value || 0;
        yearData[year] = { sales, profit, margin: sales > 0 ? (profit / sales) * 100 : 0 };
      });

      const prevMonthData: Record<number, { sales: number; profit: number }> = {};
      if (monthNum > 1) {
        availableYears.forEach(year => {
          const prevRow = monthlyData[monthNum - 2];
          prevMonthData[year] = { sales: prevRow?.[`sales_${year}`] || 0, profit: prevRow?.[`profit_${year}`] || 0 };
        });
      }

      const sortedYears = [...availableYears].sort((a, b) => b - a);

      return (
        <div className="rounded-lg border border-border bg-card p-4 shadow-lg max-w-md">
          <p className="mb-3 font-bold text-foreground text-base border-b border-border pb-2">{label}</p>
          {sortedYears.map((year, yi) => {
            const yd = yearData[year];
            if (!yd || (yd.sales === 0 && yd.profit === 0)) return null;
            const prev = prevMonthData[year];
            const salesMoM = prev && prev.sales > 0 ? ((yd.sales - prev.sales) / prev.sales) * 100 : null;
            const profitMoM = prev && prev.profit > 0 ? ((yd.profit - prev.profit) / prev.profit) * 100 : null;
            const prevYear = sortedYears.find(y => y < year);
            const prevYearData = prevYear ? yearData[prevYear] : null;
            const salesYoY = prevYearData && prevYearData.sales > 0 ? ((yd.sales - prevYearData.sales) / prevYearData.sales) * 100 : null;
            const profitYoY = prevYearData && prevYearData.profit > 0 ? ((yd.profit - prevYearData.profit) / prevYearData.profit) * 100 : null;
            const colorIdx = availableYears.indexOf(year);

            return (
              <div key={year} className={`${yi > 0 ? 'mt-3 pt-3 border-t border-border/50' : ''}`}>
                <p className="font-semibold text-foreground mb-1.5">{year}</p>
                <div className="flex items-center justify-between gap-4 text-sm mb-1">
                  <span style={{ color: YEAR_COLORS[colorIdx % YEAR_COLORS.length].sales }}>Faturamento:</span>
                  <span className="font-medium text-foreground">{formatTooltipCurrency(yd.sales)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm mb-1">
                  <span style={{ color: YEAR_COLORS[colorIdx % YEAR_COLORS.length].profit }}>Lucro:</span>
                  <span className="font-medium text-foreground">{formatTooltipCurrency(yd.profit)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm mb-1.5">
                  <span className="text-muted-foreground">Margem:</span>
                  <span className={`font-semibold ${yd.margin >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{yd.margin.toFixed(1)}%</span>
                </div>
                {monthNum > 1 && salesMoM !== null && (
                  <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                    <span>vs mês anterior:</span>
                    <span className="flex items-center gap-1">
                      <span className={salesMoM >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                        {salesMoM >= 0 ? '▲' : '▼'} {Math.abs(salesMoM).toFixed(1)}% fat.
                      </span>
                      {profitMoM !== null && (
                        <span className={`ml-1 ${profitMoM >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          | {profitMoM >= 0 ? '▲' : '▼'} {Math.abs(profitMoM).toFixed(1)}% lucro
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {salesYoY !== null && (
                  <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground mt-0.5">
                    <span>vs {prevYear}:</span>
                    <span className="flex items-center gap-1">
                      <span className={salesYoY >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                        {salesYoY >= 0 ? '▲' : '▼'} {Math.abs(salesYoY).toFixed(1)}% fat.
                      </span>
                      {profitYoY !== null && (
                        <span className={`ml-1 ${profitYoY >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          | {profitYoY >= 0 ? '▲' : '▼'} {Math.abs(profitYoY).toFixed(1)}% lucro
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="mb-2 font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === "Quantidade" ? entry.value.toLocaleString("pt-BR") : formatTooltipCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
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
                <Tooltip formatter={(value: number) => formatTooltipCurrency(value)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
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

      {/* Análise Pareto */}
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
                          <p className="text-sm text-muted-foreground">Vendas: {formatTooltipCurrency(data.sales)}</p>
                          <p className="text-sm text-muted-foreground">% do Total: {data.percentual.toFixed(1)}%</p>
                          <p className="text-sm font-medium" style={{ color: COLORS.accent }}>Acumulado: {data.cumulativo.toFixed(1)}%</p>
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
          <p className="text-xs text-muted-foreground mt-2 text-center">Identifica os produtos que mais contribuem para o faturamento total</p>
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
                          <p className="text-sm" style={{ color: COLORS.profit }}>Margem: {data.margin.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">Vendas: {formatTooltipCurrency(data.sales)}</p>
                          <p className="text-sm text-muted-foreground">Lucro: {formatTooltipCurrency(data.profit)}</p>
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
          <p className="text-xs text-muted-foreground mt-2 text-center">Compara a rentabilidade (lucro/vendas) entre os diferentes subgrupos de produtos</p>
        </CardContent>
      </Card>

      {/* Matriz BCG */}
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
                    <span className="text-sm font-medium text-muted-foreground">{(customMarginThreshold ?? bcgMatrixData.avgMargin).toFixed(1)}%</span>
                  </div>
                  <Slider value={[customMarginThreshold ?? bcgMatrixData.avgMargin]} onValueChange={(value) => setCustomMarginThreshold(value[0])} min={0} max={Math.min(bcgMatrixData.maxMargin, 100)} step={0.5} className="w-full" />
                  <p className="text-xs text-muted-foreground">Média calculada: {bcgMatrixData.avgMargin.toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Limite de Vendas (R$)</Label>
                    <span className="text-sm font-medium text-muted-foreground">{formatTooltipCurrency(customSalesThreshold ?? bcgMatrixData.avgSales)}</span>
                  </div>
                  <Slider value={[customSalesThreshold ?? bcgMatrixData.avgSales]} onValueChange={(value) => setCustomSalesThreshold(value[0])} min={0} max={bcgMatrixData.maxSales} step={bcgMatrixData.maxSales / 100} className="w-full" />
                  <p className="text-xs text-muted-foreground">Média calculada: {formatTooltipCurrency(bcgMatrixData.avgSales)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setCustomMarginThreshold(null); setCustomSalesThreshold(null); }} className="w-full">Restaurar Valores Padrão</Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" dataKey="sales" name="Vendas" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} label={{ value: 'Volume de Vendas', position: 'bottom', offset: 0, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="number" dataKey="margin" name="Margem" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v.toFixed(0)}%`} label={{ value: 'Margem %', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }} />
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
                          <p className="text-sm" style={{ color: COLORS.sales }}>Vendas: {formatTooltipCurrency(data.sales)}</p>
                          <p className="text-sm" style={{ color: COLORS.profit }}>Margem: {data.margin.toFixed(1)}%</p>
                          <p className="text-sm font-medium mt-1" style={{
                            color: data.quadrant === 'Estrela' ? COLORS.profit :
                              data.quadrant === 'Vaca Leiteira' ? COLORS.sales :
                                data.quadrant === 'Interrogação' ? COLORS.accent : 'hsl(var(--destructive))'
                          }}>Quadrante: {data.quadrant}</p>
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

      {/* Ticket Médio por Loja */}
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
                          <p className="text-sm" style={{ color: COLORS.accent }}>Ticket Médio: {formatTooltipCurrency(data.ticketMedio)}</p>
                          <p className="text-sm text-muted-foreground">Total Vendas: {formatTooltipCurrency(data.sales)}</p>
                          <p className="text-sm text-muted-foreground">Qtd. Vendida: {data.quantity.toLocaleString('pt-BR')}</p>
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
                          <p className="text-sm" style={{ color: COLORS.quantity }}>Ticket Médio: {formatTooltipCurrency(data.ticketMedio)}</p>
                          <p className="text-sm text-muted-foreground">Total Vendas: {formatTooltipCurrency(data.sales)}</p>
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
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Em Alta
              </h4>
              <div className="space-y-2">
                {trendingProductsData.rising.length > 0 ? trendingProductsData.rising.map((product) => (
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
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Em Queda
              </h4>
              <div className="space-y-2">
                {trendingProductsData.falling.length > 0 ? trendingProductsData.falling.map((product) => (
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
          <p className="text-xs text-muted-foreground mt-4 text-center">Análise baseada na variação de vendas nos últimos meses disponíveis</p>
        </CardContent>
      </Card>
    </div>
  );
}
