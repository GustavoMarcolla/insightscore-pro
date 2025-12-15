import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Documento {
  id: string;
  codigo: number;
  fornecedor_id: string;
  data_recebimento: string;
  serie_nf: string | null;
  numero_nf: string | null;
  observacao: string | null;
  status: "pendente" | "concluido";
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface DocumentoWithFornecedor extends Documento {
  fornecedor_nome: string;
  fornecedor_codigo: string;
}

export interface DocumentoCriterio {
  id: string;
  documento_id: string;
  criterio_id: string;
  score: number;
  observacao: string | null;
}

export interface DocumentoAnexo {
  id: string;
  documento_id: string;
  criterio_id: string | null;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
}

export interface CreateDocumentoData {
  fornecedor_id: string;
  data_recebimento: string;
  serie_nf?: string;
  numero_nf?: string;
  observacao?: string;
}

export interface CreateCriterioAvaliacaoData {
  documento_id: string;
  criterio_id: string;
  score: number;
  observacao?: string;
}

export function useDocumentos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documentos = [], isLoading, error } = useQuery({
    queryKey: ["documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select(`
          id,
          codigo,
          fornecedor_id,
          data_recebimento,
          serie_nf,
          numero_nf,
          observacao,
          status,
          created_at,
          updated_at,
          created_by,
          fornecedores (nome, codigo)
        `)
        .order("codigo", { ascending: false });

      if (error) throw error;
      
      return data.map((d) => ({
        ...d,
        fornecedor_nome: d.fornecedores?.nome || "",
        fornecedor_codigo: d.fornecedores?.codigo || "",
      })) as DocumentoWithFornecedor[];
    },
  });

  const createDocumentoMutation = useMutation({
    mutationFn: async (data: CreateDocumentoData) => {
      const { data: result, error } = await supabase
        .from("documentos")
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao criar documento", description: error.message });
    },
  });

  const updateDocumentoMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateDocumentoData> & { status?: string }) => {
      const { error } = await supabase
        .from("documentos")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao atualizar documento", description: error.message });
    },
  });

  const deleteDocumentoMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete related records
      await supabase.from("documento_criterios").delete().eq("documento_id", id);
      await supabase.from("documento_anexos").delete().eq("documento_id", id);
      
      const { error } = await supabase
        .from("documentos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Qualificação excluída com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao excluir qualificação", description: error.message });
    },
  });

  const saveCriteriosMutation = useMutation({
    mutationFn: async (criterios: CreateCriterioAvaliacaoData[]) => {
      const { error } = await supabase
        .from("documento_criterios")
        .upsert(criterios, { onConflict: "documento_id,criterio_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao salvar avaliações", description: error.message });
    },
  });

  const uploadAnexoMutation = useMutation({
    mutationFn: async ({ 
      documentoId, 
      criterioId, 
      file 
    }: { 
      documentoId: string; 
      criterioId?: string; 
      file: File 
    }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${documentoId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("qualificacoes")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("documento_anexos")
        .insert({
          documento_id: documentoId,
          criterio_id: criterioId || null,
          file_path: fileName,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        });
      
      if (dbError) throw dbError;
      
      return fileName;
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao enviar arquivo", description: error.message });
    },
  });

  const getAnexos = async (documentoId: string) => {
    const { data, error } = await supabase
      .from("documento_anexos")
      .select("*")
      .eq("documento_id", documentoId);
    
    if (error) throw error;
    return data as DocumentoAnexo[];
  };

  const getDocumentoCriterios = async (documentoId: string) => {
    const { data, error } = await supabase
      .from("documento_criterios")
      .select("*")
      .eq("documento_id", documentoId);
    
    if (error) throw error;
    return data as DocumentoCriterio[];
  };

  return {
    documentos,
    isLoading,
    error,
    createDocumento: createDocumentoMutation.mutateAsync,
    updateDocumento: updateDocumentoMutation.mutate,
    deleteDocumento: deleteDocumentoMutation.mutate,
    saveCriterios: saveCriteriosMutation.mutateAsync,
    uploadAnexo: uploadAnexoMutation.mutateAsync,
    getAnexos,
    getDocumentoCriterios,
    isCreating: createDocumentoMutation.isPending,
    isSaving: saveCriteriosMutation.isPending,
    isUploading: uploadAnexoMutation.isPending,
    isDeleting: deleteDocumentoMutation.isPending,
  };
}
