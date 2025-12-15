import { Users, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ScoreBadge } from "@/components/ui/score-badge";

// Mock data for demonstration
const topSuppliers = [
  { id: 1, name: "Fornecedor Alpha Ltda", score: 95 },
  { id: 2, name: "Tech Solutions S.A.", score: 92 },
  { id: 3, name: "Industrial Parts Co.", score: 88 },
  { id: 4, name: "Quality Materials", score: 85 },
  { id: 5, name: "Express Delivery Inc.", score: 82 },
];

const bottomSuppliers = [
  { id: 6, name: "Basic Supplies", score: 55 },
  { id: 7, name: "Old Provider LLC", score: 58 },
  { id: 8, name: "Budget Parts", score: 62 },
  { id: 9, name: "Simple Services", score: 65 },
  { id: 10, name: "Standard Materials", score: 68 },
];

const lowScoreCriteria = [
  { id: 1, name: "Prazo de Entrega", avgScore: 62 },
  { id: 2, name: "Documentação", avgScore: 65 },
  { id: 3, name: "Embalagem", avgScore: 68 },
  { id: 4, name: "Comunicação", avgScore: 70 },
];

export default function Dashboard() {
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
          value="48"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Qualificações do Mês"
          value="127"
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Score Médio"
          value="78%"
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          title="Fornecedores em Risco"
          value="6"
          icon={AlertTriangle}
          trend={{ value: 2, isPositive: false }}
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
            {topSuppliers.map((supplier, index) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{supplier.name}</span>
                </div>
                <ScoreBadge score={supplier.score} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Suppliers */}
        <div className="card-section">
          <div className="card-header-section">
            <h2 className="section-title">Fornecedores em Risco</h2>
          </div>
          <div className="space-y-3">
            {bottomSuppliers.map((supplier, index) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-sm font-medium">{supplier.name}</span>
                <ScoreBadge score={supplier.score} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Low Score Criteria */}
        <div className="card-section lg:col-span-2">
          <div className="card-header-section">
            <h2 className="section-title">Critérios com Menor Score</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lowScoreCriteria.map((criteria, index) => (
              <div
                key={criteria.id}
                className="rounded-md border border-border p-4 text-center animate-fade-in"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <p className="text-sm text-muted-foreground">{criteria.name}</p>
                <div className="mt-2">
                  <ScoreBadge score={criteria.avgScore} size="lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
