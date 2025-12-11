import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Tag, TrendingUp, Package, Percent, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const OFFER_TYPE_LABELS: Record<string, string> = {
  semanal: "Semanal",
  comerciante: "Comerciante",
  especial_carnes: "Especial de Carnes",
  final_de_semana: "Final de Semana",
  super_feira: "Super Feira",
};

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const OfferDashboard = () => {
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  const { data: offers, isLoading, refetch } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          *,
          offer_products (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const years = useMemo(() => {
    if (!offers) return [];
    const uniqueYears = [...new Set(offers.map((o) => new Date(o.start_date).getFullYear()))];
    return uniqueYears.sort((a, b) => b - a);
  }, [offers]);

  const filteredOffers = useMemo(() => {
    if (!offers) return [];
    return offers.filter((offer) => {
      const matchesType = filterType === "all" || offer.offer_type === filterType;
      const matchesYear = filterYear === "all" || new Date(offer.start_date).getFullYear().toString() === filterYear;
      return matchesType && matchesYear;
    });
  }, [offers, filterType, filterYear]);

  const stats = useMemo(() => {
    if (!filteredOffers.length) return null;

    const totalOffers = filteredOffers.length;
    const totalProducts = filteredOffers.reduce((sum, o) => sum + (o.offer_products?.length || 0), 0);
    const avgMargin = filteredOffers.reduce((sum, o) => {
      const margins = o.offer_products?.filter((p: any) => p.margin != null).map((p: any) => p.margin) || [];
      return sum + (margins.length ? margins.reduce((a: number, b: number) => a + b, 0) / margins.length : 0);
    }, 0) / totalOffers;
    
    const promoTypeCount = filteredOffers.reduce((acc, o) => {
      o.offer_products?.forEach((p: any) => {
        acc[p.promo_type || "geral"] = (acc[p.promo_type || "geral"] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return { totalOffers, totalProducts, avgMargin, promoTypeCount };
  }, [filteredOffers]);

  const offersByTypeData = useMemo(() => {
    if (!filteredOffers.length) return [];
    const counts: Record<string, number> = {};
    filteredOffers.forEach((o) => {
      counts[o.offer_type] = (counts[o.offer_type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      name: OFFER_TYPE_LABELS[type] || type,
      value: count,
    }));
  }, [filteredOffers]);

  const productsBySessionData = useMemo(() => {
    if (!filteredOffers.length) return [];
    const counts: Record<string, number> = {};
    filteredOffers.forEach((o) => {
      o.offer_products?.forEach((p: any) => {
        if (p.session_name) {
          counts[p.session_name] = (counts[p.session_name] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [filteredOffers]);

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase.from("offers").delete().eq("id", offerId);
      if (error) throw error;

      toast({
        title: "Oferta excluída",
        description: "A oferta foi removida com sucesso.",
      });
      refetch();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a oferta.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Oferta</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(OFFER_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Ofertas</p>
                  <p className="text-2xl font-bold">{stats.totalOffers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-chart-2/20">
                  <Package className="h-6 w-6 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Produtos</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-chart-3/20">
                  <Percent className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margem Média</p>
                  <p className="text-2xl font-bold">{stats.avgMargin.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-chart-4/20">
                  <TrendingUp className="h-6 w-6 text-chart-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clube vs Geral</p>
                  <p className="text-2xl font-bold">
                    {stats.promoTypeCount.clube || 0} / {stats.promoTypeCount.geral || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ofertas por Tipo</CardTitle>
            <CardDescription>Distribuição das ofertas por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={offersByTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {offersByTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Sessões</CardTitle>
            <CardDescription>Sessões com mais produtos em ofertas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsBySessionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ofertas</CardTitle>
          <CardDescription>Lista de todas as ofertas cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Lâmina</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Data Upload</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma oferta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {OFFER_TYPE_LABELS[offer.offer_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(offer.start_date), "dd/MM/yy", { locale: ptBR })} -{" "}
                        {format(new Date(offer.end_date), "dd/MM/yy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge>Lâmina {offer.lamina_number.toString().padStart(2, "0")}</Badge>
                    </TableCell>
                    <TableCell>{offer.offer_products?.length || 0}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={offer.file_name}>
                      {offer.file_name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(offer.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir oferta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Todos os produtos desta oferta serão removidos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteOffer(offer.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfferDashboard;
