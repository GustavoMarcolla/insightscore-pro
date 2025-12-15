import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Upload, X, Star, Check, ChevronLeft, ChevronRight, ImageIcon, FileText } from "lucide-react";
import { useDocumentos } from "@/hooks/useDocumentos";
import { useCriterios, CriterioWithGrupo } from "@/hooks/useCriterios";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContinuarAvaliacaoWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentoId: string;
}

interface CriterioAvaliacao {
  criterio_id: string;
  score: number;
  observacao: string;
  files: File[];
}

export function ContinuarAvaliacaoWizard({ open, onOpenChange, documentoId }: ContinuarAvaliacaoWizardProps) {
  const [step, setStep] = useState(1);
  const [avaliacoes, setAvaliacoes] = useState<Record<string, CriterioAvaliacao>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentoInfo, setDocumentoInfo] = useState<{
    fornecedor_nome: string;
    data_recebimento: string;
    serie_nf: string | null;
    numero_nf: string | null;
  } | null>(null);

  const { toast } = useToast();
  const { criterios } = useCriterios();
  const { saveCriterios, uploadAnexo, updateDocumento, getDocumentoCriterios } = useDocumentos();

  const activeCriterios = criterios.filter((c) => c.situacao === "ativo");
  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    if (open && documentoId) {
      loadDocumentoData();
    }
  }, [open, documentoId]);

  const loadDocumentoData = async () => {
    // Load documento info
    const { data: docData } = await supabase
      .from("documentos")
      .select(`
        data_recebimento,
        serie_nf,
        numero_nf,
        fornecedores (nome)
      `)
      .eq("id", documentoId)
      .single();

    if (docData) {
      setDocumentoInfo({
        fornecedor_nome: (docData.fornecedores as any)?.nome || "",
        data_recebimento: docData.data_recebimento,
        serie_nf: docData.serie_nf,
        numero_nf: docData.numero_nf,
      });
    }

    // Load existing avaliacoes
    const existingCriterios = await getDocumentoCriterios(documentoId);
    
    const initialAvaliacoes: Record<string, CriterioAvaliacao> = {};
    activeCriterios.forEach((c) => {
      const existing = existingCriterios.find((ec) => ec.criterio_id === c.id);
      initialAvaliacoes[c.id] = {
        criterio_id: c.id,
        score: existing?.score || 0,
        observacao: existing?.observacao || "",
        files: [],
      };
    });
    setAvaliacoes(initialAvaliacoes);
  };

  const handleClose = () => {
    setStep(1);
    setAvaliacoes({});
    setDocumentoInfo(null);
    onOpenChange(false);
  };

  const handleNextStep = () => {
    const unscored = activeCriterios.filter((c) => !avaliacoes[c.id] || avaliacoes[c.id].score === 0);
    if (unscored.length > 0) {
      toast({ 
        variant: "destructive", 
        title: "Avaliação incompleta", 
        description: `Avalie todos os ${unscored.length} critérios pendentes` 
      });
      return;
    }
    setStep(2);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleScoreChange = (criterioId: string, score: number) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [criterioId]: {
        ...prev[criterioId],
        score,
      },
    }));
  };

  const handleObservacaoChange = (criterioId: string, observacao: string) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [criterioId]: {
        ...prev[criterioId],
        observacao,
      },
    }));
  };

  const handleFileAdd = (criterioId: string, files: FileList) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [criterioId]: {
        ...prev[criterioId],
        files: [...prev[criterioId].files, ...Array.from(files)],
      },
    }));
  };

  const handleFileRemove = (criterioId: string, fileIndex: number) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [criterioId]: {
        ...prev[criterioId],
        files: prev[criterioId].files.filter((_, i) => i !== fileIndex),
      },
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Save criterios
      const criteriosData = Object.values(avaliacoes).map((a) => ({
        documento_id: documentoId,
        criterio_id: a.criterio_id,
        score: a.score,
        observacao: a.observacao || undefined,
      }));

      await saveCriterios(criteriosData);

      // Upload files
      for (const avaliacao of Object.values(avaliacoes)) {
        for (const file of avaliacao.files) {
          await uploadAnexo({
            documentoId,
            criterioId: avaliacao.criterio_id,
            file,
          });
        }
      }

      // Update documento status to concluido
      updateDocumento({ id: documentoId, status: "concluido" });

      toast({ title: "Qualificação concluída com sucesso!" });
      handleClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar qualificação" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group criterios by grupo
  const criteriosByGrupo = activeCriterios.reduce((acc, c) => {
    const grupo = c.grupo_descricao || "Sem Grupo";
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(c);
    return acc;
  }, {} as Record<string, CriterioWithGrupo[]>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Continuar Avaliação</DialogTitle>
          {documentoInfo && (
            <div className="text-sm text-muted-foreground mt-2">
              <p><strong>Fornecedor:</strong> {documentoInfo.fornecedor_nome}</p>
              <p><strong>Data:</strong> {format(new Date(documentoInfo.data_recebimento), "dd/MM/yyyy", { locale: ptBR })}</p>
              {(documentoInfo.serie_nf || documentoInfo.numero_nf) && (
                <p><strong>NF:</strong> {documentoInfo.serie_nf && `Série ${documentoInfo.serie_nf} - `}Nº {documentoInfo.numero_nf || "-"}</p>
              )}
            </div>
          )}
          <div className="pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Passo {step} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              <span className={cn("text-xs", step >= 1 && "text-primary font-medium")}>Avaliação</span>
              <span className={cn("text-xs", step >= 2 && "text-primary font-medium")}>Revisão</span>
            </div>
          </div>
        </DialogHeader>

        {/* Step 1: Avaliação dos Critérios */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            {Object.entries(criteriosByGrupo).map(([grupo, criteriosList]) => (
              <div key={grupo} className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {grupo}
                </h3>
                {criteriosList.map((criterio) => (
                  <CriterioCard
                    key={criterio.id}
                    criterio={criterio}
                    avaliacao={avaliacoes[criterio.id]}
                    onScoreChange={(score) => handleScoreChange(criterio.id, score)}
                    onObservacaoChange={(obs) => handleObservacaoChange(criterio.id, obs)}
                    onFileAdd={(files) => handleFileAdd(criterio.id, files)}
                    onFileRemove={(index) => handleFileRemove(criterio.id, index)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Revisão */}
        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="card-section">
              <h3 className="section-title mb-4">Resumo das Avaliações</h3>
              <div className="space-y-3">
                {Object.entries(criteriosByGrupo).map(([grupo, criteriosList]) => (
                  <div key={grupo}>
                    <p className="text-xs text-muted-foreground uppercase mb-2">{grupo}</p>
                    {criteriosList.map((criterio) => {
                      const avaliacao = avaliacoes[criterio.id];
                      return (
                        <div key={criterio.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm">{criterio.descricao}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "h-4 w-4",
                                    star <= (avaliacao?.score || 0)
                                      ? "fill-warning text-warning"
                                      : "text-muted"
                                  )}
                                />
                              ))}
                            </div>
                            {avaliacao?.files.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {avaliacao.files.length} arquivo(s)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Média Geral:</span>
                  <span className="text-lg font-bold text-primary">
                    {(
                      Object.values(avaliacoes).reduce((sum, a) => sum + a.score, 0) /
                      Object.values(avaliacoes).length * 20
                    ).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? handleClose : handlePrevStep}
          >
            {step === 1 ? "Cancelar" : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </>
            )}
          </Button>
          
          {step < 2 ? (
            <Button onClick={handleNextStep}>
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Concluir Qualificação
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CriterioCardProps {
  criterio: CriterioWithGrupo;
  avaliacao?: CriterioAvaliacao;
  onScoreChange: (score: number) => void;
  onObservacaoChange: (obs: string) => void;
  onFileAdd: (files: FileList) => void;
  onFileRemove: (index: number) => void;
}

function CriterioCard({
  criterio,
  avaliacao,
  onScoreChange,
  onObservacaoChange,
  onFileAdd,
  onFileRemove,
}: CriterioCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{criterio.descricao}</p>
          <p className="text-xs text-muted-foreground">{criterio.codigo}</p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onScoreChange(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  star <= (avaliacao?.score || 0)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/40 hover:text-warning"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Observação (opcional)"
          value={avaliacao?.observacao || ""}
          onChange={(e) => onObservacaoChange(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
            <Upload className="h-4 w-4" />
            Anexar arquivo
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => e.target.files && onFileAdd(e.target.files)}
            />
          </label>
        </div>

        {avaliacao && avaliacao.files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {avaliacao.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-secondary rounded-md px-2 py-1 text-xs"
              >
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onFileRemove(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
