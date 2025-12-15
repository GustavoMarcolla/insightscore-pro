import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  ListChecks,
  FileText,
  Settings,
  LogOut,
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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-sidebar flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-muted/20">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-teal">
          <span className="text-lg font-bold text-white">Q+</span>
        </div>
      </div>

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
                "group flex flex-col items-center justify-center rounded-md py-3 text-sidebar-muted transition-colors hover:bg-sidebar-muted/10 hover:text-sidebar-foreground",
                isActive && "bg-sidebar-muted/10 text-sidebar-foreground"
              )}
              title={item.label}
            >
              <div className="relative">
                {isActive && (
                  <div className="absolute -left-5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-teal" />
                )}
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive && "text-brand-teal"
                  )}
                />
              </div>
              <span className="mt-1 text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-muted/20 p-2">
        <button
          onClick={handleLogout}
          className="flex w-full flex-col items-center justify-center rounded-md py-3 text-sidebar-muted transition-colors hover:bg-sidebar-muted/10 hover:text-sidebar-foreground"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
