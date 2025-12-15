import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, FileText, Image, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface DocumentoDetalhes {
  id: string;
  data_recebimento: string;
  numero_nf: string | null;
  serie_nf: string | null;
  observacao: string | null;
  status: string;
  created_at: string;
  fornecedor: {
    id: string;
    codigo: string;
    nome: string;
    cnpj: string;
  };
  criterios: Array<{
    id: string;
    score: number;
    observacao: string | null;
    criterio: {
      id: string;
      codigo: string;
      descricao: string;
    };
  }>;
  anexos: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number | null;
    criterio_id: string | null;
  }>;
}

export default function QualificacaoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: documento, isLoading } = useQuery({
    queryKey: ["documento-detalhes", id],
    queryFn: async () => {
      if (!id) throw new Error("ID não fornecido");

      const { data, error } = await supabase
        .from("documentos")
        .select(`
          id,
          data_recebimento,
          numero_nf,
          serie_nf,
          observacao,
          status,
          created_at,
          fornecedores!inner(id, codigo, nome, cnpj)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Documento não encontrado");

      // Fetch criterios
      const { data: criteriosData } = await supabase
        .from("documento_criterios")
        .select(`
          id,
          score,
          observacao,
          criterios!inner(id, codigo, descricao)
        `)
        .eq("documento_id", id);

      // Fetch anexos
      const { data: anexosData } = await supabase
        .from("documento_anexos")
        .select("*")
        .eq("documento_id", id);

      return {
        ...data,
        fornecedor: data.fornecedores,
        criterios: (criteriosData || []).map((c: any) => ({
          id: c.id,
          score: c.score,
          observacao: c.observacao,
          criterio: c.criterios,
        })),
        anexos: anexosData || [],
      } as DocumentoDetalhes;
    },
    enabled: !!id,
  });

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from("qualificacoes").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const isImage = (fileType: string) => fileType.startsWith("image/");

  const calculateAverageScore = () => {
    if (!documento?.criterios.length) return 0;
    const total = documento.criterios.reduce((acc, c) => acc + c.score, 0);
    return Math.round((total / documento.criterios.length) * 20);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-40 lg:col-span-2" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Documento não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/qualificacoes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const imageAnexos = documento.anexos.filter((a) => isImage(a.file_type));
  const docAnexos = documento.anexos.filter((a) => !isImage(a.file_type));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/qualificacoes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="page-title">Detalhes da Qualificação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(documento.data_recebimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Badge
          variant={documento.status === "concluido" ? "default" : "secondary"}
          className={documento.status === "concluido" ? "bg-success text-success-foreground" : ""}
        >
          {documento.status === "concluido" ? "Concluído" : "Pendente"}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Supplier Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{documento.fornecedor.nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Código</p>
                <p className="font-medium">{documento.fornecedor.codigo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-medium">{documento.fornecedor.cnpj}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nota Fiscal</p>
                <p className="font-medium">
                  {documento.serie_nf || documento.numero_nf
                    ? `${documento.serie_nf ? `Série ${documento.serie_nf} - ` : ""}Nº ${documento.numero_nf || "-"}`
                    : "-"}
                </p>
              </div>
            </div>
            {documento.observacao && (
              <div>
                <p className="text-sm text-muted-foreground">Observação</p>
                <p className="text-sm mt-1">{documento.observacao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Geral</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <ScoreBadge score={calculateAverageScore()} size="lg" />
            <p className="text-sm text-muted-foreground mt-2">
              {documento.criterios.length} critério(s) avaliado(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Criteria Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avaliação por Critério</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Código</TableHead>
                <TableHead className="font-semibold">Critério</TableHead>
                <TableHead className="font-semibold text-center">Score</TableHead>
                <TableHead className="font-semibold">Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documento.criterios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum critério avaliado
                  </TableCell>
                </TableRow>
              ) : (
                documento.criterios.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.criterio.codigo}</TableCell>
                    <TableCell>{c.criterio.descricao}</TableCell>
                    <TableCell className="text-center">
                      <ScoreBadge score={c.score * 20} size="sm" />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.observacao || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Photos */}
      {imageAnexos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" />
              Fotos ({imageAnexos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {imageAnexos.map((anexo) => (
                <a
                  key={anexo.id}
                  href={getFileUrl(anexo.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary/50 hover:border-primary transition-colors"
                >
                  <img
                    src={getFileUrl(anexo.file_path)}
                    alt={anexo.file_name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="h-6 w-6 text-white" />
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {docAnexos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos ({docAnexos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {docAnexos.map((anexo) => (
                <div
                  key={anexo.id}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{anexo.file_name}</p>
                      {anexo.file_size && (
                        <p className="text-xs text-muted-foreground">
                          {(anexo.file_size / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={getFileUrl(anexo.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
