import { Users, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { topSuppliers, bottomSuppliers, lowScoreCriteria, stats, isLoading } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral das qualificações de fornecedores
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fornecedores Ativos"
          value={isLoading ? "-" : stats.totalFornecedores.toString()}
          icon={Users}
        />
        <StatCard
          title="Qualificações do Mês"
          value={isLoading ? "-" : stats.qualificacoesMes.toString()}
          icon={FileText}
        />
        <StatCard
          title="Score Médio"
          value={isLoading ? "-" : `${stats.scoreMedio}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Fornecedores em Risco"
          value={isLoading ? "-" : stats.fornecedoresRisco.toString()}
          icon={AlertTriangle}
        />
      </div>

      {/* Lists Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Suppliers */}
        <div className="card-section">
          <div className="card-header-section">
            <h2 className="section-title">Top 5 Fornecedores</h2>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : topSuppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum fornecedor avaliado ainda
              </p>
            ) : (
              topSuppliers.map((supplier, index) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 animate-slide-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{supplier.nome}</span>
                  </div>
                  <ScoreBadge score={supplier.score_atual || 0} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Suppliers */}
        <div className="card-section">
          <div className="card-header-section">
            <h2 className="section-title">Fornecedores em Risco</h2>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : bottomSuppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum fornecedor em risco
              </p>
            ) : (
              bottomSuppliers.map((supplier, index) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 animate-slide-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-sm font-medium">{supplier.nome}</span>
                  <ScoreBadge score={supplier.score_atual || 0} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Score Criteria */}
        <div className="card-section lg:col-span-2">
          <div className="card-header-section">
            <h2 className="section-title">Critérios com Menor Score</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : lowScoreCriteria.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 col-span-full">
                Nenhuma avaliação de critérios ainda
              </p>
            ) : (
              lowScoreCriteria.map((criteria, index) => (
                <div
                  key={criteria.id}
                  className="rounded-md border border-border p-4 text-center animate-fade-in"
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <p className="text-sm text-muted-foreground">{criteria.descricao}</p>
                  <div className="mt-2">
                    <ScoreBadge score={criteria.avg_score} size="lg" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
