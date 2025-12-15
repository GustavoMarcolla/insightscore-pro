import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Fornecedor {
  id: string;
  codigo: string;
  nome: string;
  cnpj: string;
  endereco: string | null;
  situacao: "ativo" | "inativo";
  score_atual: number;
  total_avaliacoes: number;
  created_at: string;
  updated_at: string;
}

export interface FornecedorContato {
  id: string;
  fornecedor_id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
}

export function useFornecedores() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fornecedores = [], isLoading, error } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("codigo");

      if (error) throw error;
      return data as Fornecedor[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { codigo: string; nome: string; cnpj: string; endereco?: string }) => {
      const { error } = await supabase.from("fornecedores").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Fornecedor criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao criar fornecedor", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; codigo?: string; nome?: string; cnpj?: string; endereco?: string; situacao?: string }) => {
      const { error } = await supabase.from("fornecedores").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Fornecedor atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao atualizar fornecedor", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fornecedores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Fornecedor excluído com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao excluir fornecedor", description: error.message });
    },
  });

  const toggleSituacao = useMutation({
    mutationFn: async ({ id, situacao }: { id: string; situacao: string }) => {
      const newSituacao = situacao === "ativo" ? "inativo" : "ativo";
      const { error } = await supabase.from("fornecedores").update({ situacao: newSituacao }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast({ title: "Situação alterada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao alterar situação", description: error.message });
    },
  });

  return {
    fornecedores,
    isLoading,
    error,
    createFornecedor: createMutation.mutate,
    updateFornecedor: updateMutation.mutate,
    deleteFornecedor: deleteMutation.mutate,
    toggleSituacao: toggleSituacao.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
