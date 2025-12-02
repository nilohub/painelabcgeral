import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Filter } from "lucide-react";
import type { Filters } from "@/pages/Index";

interface DashboardFiltersProps {
  filters: Filters;
  availableFilters: {
    years: string[];
    months: string[];
    stores: string[];
    subgroups: string[];
  };
  onFilterChange: (key: keyof Filters, value: string) => void;
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
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.month} onValueChange={(v) => onFilterChange("month", v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              {MONTHS.filter((m) => availableFilters.months.includes(m.value)).map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.store} onValueChange={(v) => onFilterChange("store", v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Loja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Lojas</SelectItem>
              {availableFilters.stores.map((store) => (
                <SelectItem key={store} value={store}>
                  Loja {store}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.subgroup} onValueChange={(v) => onFilterChange("subgroup", v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Subgrupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Subgrupos</SelectItem>
              {availableFilters.subgroups.map((subgroup) => (
                <SelectItem key={subgroup} value={subgroup}>
                  {subgroup}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
