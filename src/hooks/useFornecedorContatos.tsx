import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FornecedorContato {
  id: string;
  fornecedor_id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
}

export function useFornecedorContatos(fornecedorId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contatos = [], isLoading, error } = useQuery({
    queryKey: ["fornecedor-contatos", fornecedorId],
    queryFn: async () => {
      if (!fornecedorId) return [];
      const { data, error } = await supabase
        .from("fornecedor_contatos")
        .select("*")
        .eq("fornecedor_id", fornecedorId)
        .order("nome");

      if (error) throw error;
      return data as FornecedorContato[];
    },
    enabled: !!fornecedorId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { fornecedor_id: string; nome: string; email?: string; whatsapp?: string }) => {
      const { error } = await supabase.from("fornecedor_contatos").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedor-contatos", fornecedorId] });
      queryClient.invalidateQueries({ queryKey: ["fornecedor-detalhes", fornecedorId] });
      toast({ title: "Contato criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao criar contato", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nome?: string; email?: string; whatsapp?: string }) => {
      const { error } = await supabase.from("fornecedor_contatos").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedor-contatos", fornecedorId] });
      queryClient.invalidateQueries({ queryKey: ["fornecedor-detalhes", fornecedorId] });
      toast({ title: "Contato atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao atualizar contato", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fornecedor_contatos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedor-contatos", fornecedorId] });
      queryClient.invalidateQueries({ queryKey: ["fornecedor-detalhes", fornecedorId] });
      toast({ title: "Contato excluído com sucesso" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro ao excluir contato", description: error.message });
    },
  });

  return {
    contatos,
    isLoading,
    error,
    createContato: createMutation.mutate,
    updateContato: updateMutation.mutate,
    deleteContato: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
