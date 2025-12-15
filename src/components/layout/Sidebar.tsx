import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  ListChecks,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Fornecedores", href: "/fornecedores" },
  { icon: FolderTree, label: "Grupos", href: "/grupos" },
  { icon: ListChecks, label: "Critérios", href: "/criterios" },
  { icon: FileText, label: "Qualificações", href: "/qualificacoes" },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message,
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300",
        expanded ? "w-48" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-muted/20">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-teal">
          <span className="text-lg font-bold text-white">Q+</span>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-sidebar border border-sidebar-muted/20 text-sidebar-muted hover:text-sidebar-foreground transition-colors"
        title={expanded ? "Minimizar" : "Expandir"}
      >
        {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center rounded-md py-3 text-sidebar-muted transition-colors hover:bg-sidebar-muted/10 hover:text-sidebar-foreground",
                expanded ? "px-3 gap-3" : "flex-col justify-center",
                isActive && "bg-sidebar-muted/10 text-sidebar-foreground"
              )}
              title={!expanded ? item.label : undefined}
            >
              <div className="relative">
                {isActive && (
                  <div className={cn(
                    "absolute top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-teal",
                    expanded ? "-left-3" : "-left-5"
                  )} />
                )}
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive && "text-brand-teal"
                  )}
                />
              </div>
              {expanded && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-muted/20 p-2">
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center rounded-md py-3 text-sidebar-muted transition-colors hover:bg-sidebar-muted/10 hover:text-sidebar-foreground",
            expanded ? "px-3 gap-3" : "flex-col justify-center"
          )}
          title={!expanded ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5" />
          {expanded && (
            <span className="text-sm font-medium">Sair</span>
          )}
        </button>
      </div>
    </aside>
  );
}
