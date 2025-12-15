import { Link, useLocation } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";

const routeNames: Record<string, string> = {
  dashboard: "Dashboard",
  fornecedores: "Fornecedores",
  grupos: "Grupos de Qualificação",
  criterios: "Critérios",
  qualificacoes: "Qualificações",
  configuracoes: "Configurações",
  novo: "Novo",
  editar: "Editar",
};

export function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link 
        to="/dashboard" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pathSegments.length - 1;
        const name = routeNames[segment] || segment;

        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            {isLast ? (
              <span className="font-medium text-foreground">{name}</span>
            ) : (
              <Link 
                to={path} 
                className="hover:text-foreground transition-colors"
              >
                {name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
