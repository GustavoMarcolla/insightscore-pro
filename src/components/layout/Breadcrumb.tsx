import { Link, useLocation, useParams } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

// Check if a string is a UUID
const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  // Check if we're on a fornecedor detail page
  const isFornecedorDetail = pathSegments[0] === "fornecedores" && pathSegments[1] && isUUID(pathSegments[1]);
  const fornecedorId = isFornecedorDetail ? pathSegments[1] : null;

  // Fetch fornecedor name if on detail page
  const { data: fornecedor } = useQuery({
    queryKey: ["fornecedor-breadcrumb", fornecedorId],
    queryFn: async () => {
      if (!fornecedorId) return null;
      const { data } = await supabase
        .from("fornecedores")
        .select("nome, codigo")
        .eq("id", fornecedorId)
        .maybeSingle();
      return data;
    },
    enabled: !!fornecedorId,
  });

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
        
        // Get display name
        let name = routeNames[segment] || segment;
        
        // If it's a UUID segment, try to get a meaningful name
        if (isUUID(segment)) {
          if (pathSegments[0] === "fornecedores" && fornecedor) {
            name = fornecedor.nome || fornecedor.codigo;
          } else {
            // Skip rendering UUID segments if we don't have a name
            return null;
          }
        }

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
