import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Mail, TrendingUp, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useState } from "react";
import { SendFeedbackDialog } from "@/components/feedback/SendFeedbackDialog";

interface FornecedorDetalhes {
  id: string;
  codigo: string;
  nome: string;
  cnpj: string;
  endereco: string | null;
  situacao: string;
  score_atual: number | null;
  total_avaliacoes: number | null;
  contatos: Array<{
    id: string;
    nome: string;
    email: string | null;
    whatsapp: string | null;
  }>;
  documentos: Array<{
    id: string;
    data_recebimento: string;
    numero_nf: string | null;
    status: string;
    avg_score: number;
  }>;
  criterios_scores: Array<{
    codigo: string;
    descricao: string;
    avg_score: number;
  }>;
}

export default function FornecedorDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data: fornecedor, isLoading } = useQuery({
    queryKey: ["fornecedor-detalhes", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");

      // Fetch supplier
      const { data: fornecedorData, error } = await supabase
        .from("fornecedores")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!fornecedorData) throw new Error("Fornecedor não encontrado");

      // Fetch contacts
      const { data: contatos } = await supabase
        .from("fornecedor_contatos")
        .select("*")
        .eq("fornecedor_id", id);

      // Fetch documents with scores
      const { data: documentos } = await supabase
        .from("documentos")
        .select(`
          id,
          data_recebimento,
          numero_nf,
          status,
          documento_criterios (score)
        `)
        .eq("fornecedor_id", id)
        .eq("status", "concluido")
        .order("data_recebimento", { ascending: true });

      // Calculate average score per document
      const docsWithScores = (documentos || []).map((doc: any) => {
        const scores = doc.documento_criterios?.map((dc: any) => dc.score) || [];
        const avgScore = scores.length > 0
          ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 20)
          : 0;
        return {
          id: doc.id,
          data_recebimento: doc.data_recebimento,
          numero_nf: doc.numero_nf,
          status: doc.status,
          avg_score: avgScore,
        };
      });

      // Fetch criteria scores
      const { data: criteriosData } = await supabase
        .from("documento_criterios")
        .select(`
          score,
          criterios!inner(codigo, descricao),
          documentos!inner(fornecedor_id)
        `)
        .eq("documentos.fornecedor_id", id);

      // Aggregate by criteria
      const criteriaMap = new Map<string, { descricao: string; scores: number[] }>();
      (criteriosData || []).forEach((item: any) => {
        const codigo = item.criterios?.codigo;
        const descricao = item.criterios?.descricao;
        if (codigo && descricao) {
          if (!criteriaMap.has(codigo)) {
            criteriaMap.set(codigo, { descricao, scores: [] });
          }
          criteriaMap.get(codigo)!.scores.push(item.score);
        }
      });

      const criteriosScores = Array.from(criteriaMap.entries()).map(([codigo, data]) => ({
        codigo,
        descricao: data.descricao,
        avg_score: Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 20),
      }));

      return {
        ...fornecedorData,
        contatos: contatos || [],
        documentos: docsWithScores,
        criterios_scores: criteriosScores.sort((a, b) => a.avg_score - b.avg_score),
      } as FornecedorDetalhes;
    },
    enabled: !!id,
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "hsl(var(--success))";
    if (score >= 70) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!fornecedor) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Fornecedor não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/fornecedores")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const evolutionData = fornecedor.documentos.map((doc) => ({
    date: format(new Date(doc.data_recebimento), "dd/MM", { locale: ptBR }),
    fullDate: format(new Date(doc.data_recebimento), "dd/MM/yyyy", { locale: ptBR }),
    score: doc.avg_score,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="page-title">{fornecedor.nome}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fornecedor.codigo} • {fornecedor.cnpj}
          </p>
        </div>
        <Badge variant={fornecedor.situacao === "ativo" ? "default" : "secondary"}>
          {fornecedor.situacao === "ativo" ? "Ativo" : "Inativo"}
        </Badge>
        <Button onClick={() => setFeedbackOpen(true)}>
          <Mail className="mr-2 h-4 w-4" />
          Enviar Feedback
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Atual</p>
                <div className="mt-2">
                  <ScoreBadge score={fornecedor.score_atual || 0} size="lg" />
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Avaliações</p>
                <p className="text-2xl font-bold mt-1">{fornecedor.total_avaliacoes || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contatos</p>
                <p className="text-2xl font-bold mt-1">{fornecedor.contatos.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Endereço</p>
              <p className="text-sm font-medium mt-1 line-clamp-2">
                {fornecedor.endereco || "Não informado"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Evolução do Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evolutionData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhuma avaliação registrada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ""}
                    formatter={(value: number) => [`${value}%`, "Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--brand-teal))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--brand-teal))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Criteria Scores Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score por Critério</CardTitle>
          </CardHeader>
          <CardContent>
            {fornecedor.criterios_scores.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhum critério avaliado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={fornecedor.criterios_scores}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="codigo"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, _, props) => [
                      `${value}%`,
                      props.payload.descricao,
                    ]}
                  />
                  <Bar dataKey="avg_score" radius={[0, 4, 4, 0]}>
                    {fornecedor.criterios_scores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.avg_score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Qualifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas Qualificações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Nota Fiscal</TableHead>
                <TableHead className="font-semibold text-center">Score</TableHead>
                <TableHead className="font-semibold text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedor.documentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhuma qualificação registrada
                  </TableCell>
                </TableRow>
              ) : (
                [...fornecedor.documentos].reverse().slice(0, 10).map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {format(new Date(doc.data_recebimento), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.numero_nf || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreBadge score={doc.avg_score} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/qualificacoes/${doc.id}`)}
                      >
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contacts */}
      {fornecedor.contatos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fornecedor.contatos.map((contato) => (
                <div
                  key={contato.id}
                  className="rounded-md border border-border p-4"
                >
                  <p className="font-medium">{contato.nome}</p>
                  {contato.email && (
                    <p className="text-sm text-muted-foreground">{contato.email}</p>
                  )}
                  {contato.whatsapp && (
                    <p className="text-sm text-muted-foreground">{contato.whatsapp}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <SendFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        fornecedor={fornecedor}
      />
    </div>
  );
}
