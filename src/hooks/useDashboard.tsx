import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SupplierRanking {
  id: string;
  nome: string;
  score_atual: number;
}

interface CriterioStats {
  id: string;
  descricao: string;
  avg_score: number;
}

interface MonthlyScore {
  month: string;
  avg_score: number;
}

interface DashboardStats {
  totalFornecedores: number;
  qualificacoesMes: number;
  scoreMedio: number;
  fornecedoresRisco: number;
}

export function useDashboard() {
  // Monthly score evolution for last 12 months
  const { data: monthlyScores = [], isLoading: loadingMonthly } = useQuery({
    queryKey: ["dashboard", "monthly-scores"],
    queryFn: async () => {
      const months: MonthlyScore[] = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = startOfMonth(subMonths(now, i - 1));

        const { data } = await supabase
          .from("documento_criterios")
          .select(`
            score,
            documentos!inner(created_at, status)
          `)
          .gte("documentos.created_at", monthStart.toISOString())
          .lt("documentos.created_at", monthEnd.toISOString())
          .eq("documentos.status", "concluido");

        const scores = (data || []).map((d: any) => d.score);
        const avg = scores.length > 0
          ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 20)
          : 0;

        months.push({
          month: format(monthStart, "MMM/yy", { locale: ptBR }),
          avg_score: avg,
        });
      }

      return months;
    },
  });

  // Top 5 suppliers by score
  const { data: topSuppliers = [], isLoading: loadingTop } = useQuery({
    queryKey: ["dashboard", "top-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, nome, score_atual")
        .eq("situacao", "ativo")
        .gt("total_avaliacoes", 0)
        .order("score_atual", { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as SupplierRanking[];
    },
  });

  // Bottom 5 suppliers (at risk - score < 70)
  const { data: bottomSuppliers = [], isLoading: loadingBottom } = useQuery({
    queryKey: ["dashboard", "bottom-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, nome, score_atual")
        .eq("situacao", "ativo")
        .gt("total_avaliacoes", 0)
        .lt("score_atual", 70)
        .order("score_atual", { ascending: true })
        .limit(5);

      if (error) throw error;
      return (data || []) as SupplierRanking[];
    },
  });

  // Criteria with lowest average scores
  const { data: lowScoreCriteria = [], isLoading: loadingCriteria } = useQuery({
    queryKey: ["dashboard", "low-score-criteria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documento_criterios")
        .select(`
          criterio_id,
          score,
          criterios!inner(id, descricao)
        `);

      if (error) throw error;

      // Aggregate scores by criteria
      const criteriaMap = new Map<string, { descricao: string; scores: number[] }>();
      
      (data || []).forEach((item: any) => {
        const criterioId = item.criterio_id;
        const descricao = item.criterios?.descricao || "";
        
        if (!criteriaMap.has(criterioId)) {
          criteriaMap.set(criterioId, { descricao, scores: [] });
        }
        criteriaMap.get(criterioId)!.scores.push(item.score);
      });

      // Calculate averages and sort
      const criteriaStats: CriterioStats[] = [];
      criteriaMap.forEach((value, key) => {
        const avg = value.scores.reduce((a, b) => a + b, 0) / value.scores.length;
        criteriaStats.push({
          id: key,
          descricao: value.descricao,
          avg_score: Math.round(avg * 20), // Convert 0-5 to 0-100
        });
      });

      return criteriaStats
        .sort((a, b) => a.avg_score - b.avg_score)
        .slice(0, 4);
    },
  });

  // Dashboard statistics
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      // Count active suppliers
      const { count: totalFornecedores } = await supabase
        .from("fornecedores")
        .select("*", { count: "exact", head: true })
        .eq("situacao", "ativo");

      // Count qualifications this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: qualificacoesMes } = await supabase
        .from("documentos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      // Average score
      const { data: scoreData } = await supabase
        .from("fornecedores")
        .select("score_atual")
        .eq("situacao", "ativo")
        .gt("total_avaliacoes", 0);

      const scores = (scoreData || []).map((s) => s.score_atual || 0);
      const scoreMedio = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      // Count at-risk suppliers (score < 70)
      const { count: fornecedoresRisco } = await supabase
        .from("fornecedores")
        .select("*", { count: "exact", head: true })
        .eq("situacao", "ativo")
        .gt("total_avaliacoes", 0)
        .lt("score_atual", 70);

      return {
        totalFornecedores: totalFornecedores || 0,
        qualificacoesMes: qualificacoesMes || 0,
        scoreMedio,
        fornecedoresRisco: fornecedoresRisco || 0,
      } as DashboardStats;
    },
  });

  return {
    monthlyScores,
    topSuppliers,
    bottomSuppliers,
    lowScoreCriteria,
    stats: stats || {
      totalFornecedores: 0,
      qualificacoesMes: 0,
      scoreMedio: 0,
      fornecedoresRisco: 0,
    },
    isLoading: loadingMonthly || loadingTop || loadingBottom || loadingCriteria || loadingStats,
  };
}
