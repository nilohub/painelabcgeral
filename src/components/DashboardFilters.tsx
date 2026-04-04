import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { Filters } from "@/pages/Index";

interface DashboardFiltersProps {
  filters: Filters;
  availableFilters: {
    years: string[];
    months: string[];
    stores: string[];
    subgroups: string[];
  };
  onFilterChange: (key: keyof Filters, value: string | string[]) => void;
}

const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export function DashboardFilters({ filters, availableFilters, onFilterChange }: DashboardFiltersProps) {
  const toggleStore = (store: string) => {
    const current = filters.stores;
    const updated = current.includes(store)
      ? current.filter(s => s !== store)
      : [...current, store];
    onFilterChange("stores", updated);
  };

  const clearStores = () => {
    onFilterChange("stores", []);
  };

  const storesLabel = filters.stores.length === 0
    ? "Todas as Lojas"
    : filters.stores.length <= 3
      ? filters.stores.map(s => `Loja ${s}`).join(", ")
      : `${filters.stores.length} lojas`;

  return (
    <Card className="border-border bg-card shadow-card">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          <Select value={filters.year} onValueChange={(v) => onFilterChange("year", v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Anos</SelectItem>
              {availableFilters.years.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.month} onValueChange={(v) => onFilterChange("month", v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-between text-sm font-normal">
                <span className="truncate">{storesLabel}</span>
                {filters.stores.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {filters.stores.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
              <div className="space-y-1">
                {filters.stores.length > 0 && (
                  <button
                    onClick={clearStores}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Limpar seleção
                  </button>
                )}
                {availableFilters.stores.map((store) => (
                  <label
                    key={store}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={filters.stores.includes(store)}
                      onCheckedChange={() => toggleStore(store)}
                    />
                    Loja {store}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Select value={filters.subgroup} onValueChange={(v) => onFilterChange("subgroup", v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Subgrupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Subgrupos</SelectItem>
              {availableFilters.subgroups.map((subgroup) => (
                <SelectItem key={subgroup} value={subgroup}>{subgroup}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
