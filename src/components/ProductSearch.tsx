import { Input } from "@/components/ui/input";
import { Search, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  matchedProduct?: string;
}

export function ProductSearch({ value, onChange, resultCount, matchedProduct }: ProductSearchProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-center group">
        <div className="absolute left-3 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 group-focus-within:bg-primary/20 transition-colors">
          <Search className="h-4 w-4 text-primary" />
        </div>
        <Input
          placeholder="Pesquisar por código ou nome do produto..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-14 pr-10 w-full md:w-96 h-12 bg-card border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl shadow-sm transition-all"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {value && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border-0">
            <Package className="h-3.5 w-3.5" />
            <span className="font-medium">Pesquisando:</span>
            <span className="font-semibold">{value}</span>
          </Badge>
          {resultCount !== undefined && (
            <Badge variant="outline" className="px-3 py-1.5">
              {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
            </Badge>
          )}
        </div>
      )}
      
      {matchedProduct && value && (
        <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg border border-accent animate-fade-in">
          <Package className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">Produto encontrado:</span>
          <span className="text-sm font-semibold text-foreground">{matchedProduct}</span>
        </div>
      )}
    </div>
  );
}
