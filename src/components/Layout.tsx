import { Link, useLocation } from "react-router-dom";
import { Upload, History, Tag, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
interface LayoutProps {
  children: React.ReactNode;
}
const navItems = [{
  path: "/",
  label: "Dashboard",
  icon: BarChart3
}, {
  path: "/upload",
  label: "Upload",
  icon: Upload
}, {
  path: "/historico",
  label: "Histórico",
  icon: History
}, {
  path: "/ofertas",
  label: "Ofertas",
  icon: Tag
}];
export function Layout({
  children
}: LayoutProps) {
  const location = useLocation();
  return <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Saturno Cinco - Nilo Atacadista </h1>
              <p className="text-xs text-muted-foreground">Painel de Dados Analíticos - Desenvolvido por Adrian H. </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return <Link key={item.path} to={item.path} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200", isActive ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>;
          })}
          </nav>
        </div>
      </header>

      <main className="container py-6 animate-fade-in">
        {children}
      </main>
    </div>;
}