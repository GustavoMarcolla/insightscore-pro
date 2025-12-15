import { useState, useEffect } from "react";
import { Mail, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SendFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor: {
    id: string;
    nome: string;
    codigo: string;
  } | null;
}

export function SendFeedbackDialog({ open, onOpenChange, fornecedor }: SendFeedbackDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasContacts, setHasContacts] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check if supplier has contacts when dialog opens
  useEffect(() => {
    if (open && fornecedor) {
      setIsLoading(true);
      setHasContacts(null);
      
      supabase
        .from("fornecedor_contatos")
        .select("id, email")
        .eq("fornecedor_id", fornecedor.id)
        .not("email", "is", null)
        .then(({ data }) => {
          setHasContacts(data && data.length > 0);
          setIsLoading(false);
        });
    }
  }, [open, fornecedor]);

  const handleSend = async () => {
    if (!fornecedor || !hasContacts) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-supplier-feedback", {
        body: { fornecedorId: fornecedor.id },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Feedback enviado!",
        description: data.message || "Email enviado com sucesso.",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending feedback:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar feedback",
        description: "Não foi possível enviar o email. Tente novamente.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-teal" />
            Enviar Feedback
          </DialogTitle>
          <DialogDescription>
            Envie um relatório de qualificação por email para o fornecedor com sugestões de melhoria geradas por IA.
          </DialogDescription>
        </DialogHeader>

        {fornecedor && (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Fornecedor</p>
              <p className="font-medium">{fornecedor.nome}</p>
              <p className="text-sm text-muted-foreground">{fornecedor.codigo}</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : hasContacts === false ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este fornecedor não possui contatos com email cadastrado. 
                  Cadastre um contato na aba "Contatos" antes de enviar o feedback.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>O email incluirá:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Qualificações do último mês</li>
                  <li>Score geral do fornecedor</li>
                  <li>Critérios com menor pontuação</li>
                  <li>Sugestões de melhoria geradas por IA</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || isLoading || !hasContacts}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Feedback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
