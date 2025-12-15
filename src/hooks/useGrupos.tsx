import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Grupo {
  id: string;
  codigo: string;
  descricao: string;
  situacao: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface GrupoWithCount extends Grupo {
  criterios_count: number;
}

export function useGrupos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: grupos = [], isLoading, error } = useQuery({
    queryKey: ["grupos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos_qualificacao")
        .select("*")
        .order("codigo");

      if (error) throw error;
      return data as Grupo[];
    },
  });

  const { data: gruposWithCount = [] } = useQuery({
    queryKey: ["grupos-with-count"],
    queryFn: async () => {
      const { data: gruposData, error: gruposError } = await supabase
        .from("grupos_qualificacao")
        .select("*")
        .order("codigo");

      if (gruposError) throw gruposError;

      const { data: criteriosData, error: criteriosError } = await supabase
        .from("criterios")
        .select("grupo_id");

      if (criteriosError) throw criteriosError;

      const countMap = criteriosData.reduce((acc, c) => {
        if (c.grupo_id) {
          acc[c.grupo_id] = (acc[c.grupo_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return gruposData.map((g) => ({
        ...g,
        criterios_count: countMap[g.id] || 0,
      })) as GrupoWithCount[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { codigo: string; descricao: string }) => {
      const { error } = await supabase.from("grupos_qualificacao").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
      queryClient.invalidateQueries({ queryKey: ["grupos-with-count"] });
      toast({ title: "Grupo criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao criar grupo", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; codigo?: string; descricao?: string; situacao?: string }) => {
      const { error } = await supabase.from("grupos_qualificacao").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
      queryClient.invalidateQueries({ queryKey: ["grupos-with-count"] });
      toast({ title: "Grupo atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao atualizar grupo", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grupos_qualificacao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
      queryClient.invalidateQueries({ queryKey: ["grupos-with-count"] });
      toast({ title: "Grupo excluído com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao excluir grupo", description: error.message });
    },
  });

  const toggleSituacao = useMutation({
    mutationFn: async ({ id, situacao }: { id: string; situacao: string }) => {
      const newSituacao = situacao === "ativo" ? "inativo" : "ativo";
      const { error } = await supabase.from("grupos_qualificacao").update({ situacao: newSituacao }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
      queryClient.invalidateQueries({ queryKey: ["grupos-with-count"] });
      toast({ title: "Situação alterada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao alterar situação", description: error.message });
    },
  });

  return {
    grupos,
    gruposWithCount,
    isLoading,
    error,
    createGrupo: createMutation.mutate,
    updateGrupo: updateMutation.mutate,
    deleteGrupo: deleteMutation.mutate,
    toggleSituacao: toggleSituacao.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
