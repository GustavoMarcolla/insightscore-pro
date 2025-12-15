import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute() {
  const { user, loading, isAuthenticated, isInIframe, seniorAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Aceita autenticação via Supabase OU Senior X
  if (!isAuthenticated) {
    // Se está em iframe mas não autenticou via Senior X, mostra mensagem específica
    if (isInIframe && !seniorAuthenticated) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 text-center p-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Aguardando autenticação Senior X...</p>
          </div>
        </div>
      );
    }
    
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
