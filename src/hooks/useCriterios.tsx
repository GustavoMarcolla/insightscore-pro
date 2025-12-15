import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Criterio {
  id: string;
  codigo: string;
  descricao: string;
  grupo_id: string | null;
  situacao: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface CriterioWithGrupo extends Criterio {
  grupo_descricao: string | null;
}

export function useCriterios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: criterios = [], isLoading, error } = useQuery({
    queryKey: ["criterios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("criterios")
        .select(`
          *,
          grupos_qualificacao (descricao)
        `)
        .order("codigo");

      if (error) throw error;
      
      return data.map((c) => ({
        ...c,
        grupo_descricao: c.grupos_qualificacao?.descricao || null,
      })) as CriterioWithGrupo[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { codigo: string; descricao: string; grupo_id?: string }) => {
      const { error } = await supabase.from("criterios").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criterios"] });
      queryClient.invalidateQueries({ queryKey: ["grupos-with-count"] });
      toast({ title: "Critério criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao criar critério", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; codigo?: string; descricao?: string; grupo_id?: string; situacao?: string }) => {
      const { error } = await supabase.from("criterios").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criterios"] });
      queryClient.invalidateQueries({ queryKey: ["grupos-with-count"] });
      toast({ title: "Critério atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao atualizar critério", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("criterios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criterios"] });
      queryClient.invalidateQueries({ queryKey: ["grupos-with-count"] });
      toast({ title: "Critério excluído com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao excluir critério", description: error.message });
    },
  });

  const toggleSituacao = useMutation({
    mutationFn: async ({ id, situacao }: { id: string; situacao: string }) => {
      const newSituacao = situacao === "ativo" ? "inativo" : "ativo";
      const { error } = await supabase.from("criterios").update({ situacao: newSituacao }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criterios"] });
      toast({ title: "Situação alterada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao alterar situação", description: error.message });
    },
  });

  return {
    criterios,
    isLoading,
    error,
    createCriterio: createMutation.mutate,
    updateCriterio: updateMutation.mutate,
    deleteCriterio: deleteMutation.mutate,
    toggleSituacao: toggleSituacao.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
