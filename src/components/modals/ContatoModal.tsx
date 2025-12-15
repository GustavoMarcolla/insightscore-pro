import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FornecedorContato } from "@/hooks/useFornecedorContatos";

const contatoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  whatsapp: z.string().max(20, "Máximo 20 caracteres").optional(),
});

interface ContatoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contato?: FornecedorContato | null;
  fornecedorId: string;
  onSave: (data: { id?: string; fornecedor_id: string; nome: string; email?: string; whatsapp?: string }) => void;
  isLoading?: boolean;
}

export function ContatoModal({ open, onOpenChange, contato, fornecedorId, onSave, isLoading }: ContatoModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contato) {
      setNome(contato.nome);
      setEmail(contato.email || "");
      setWhatsapp(contato.whatsapp || "");
    } else {
      setNome("");
      setEmail("");
      setWhatsapp("");
    }
    setErrors({});
  }, [contato, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = contatoSchema.safeParse({ nome, email: email || undefined, whatsapp: whatsapp || undefined });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSave({
      ...(contato && { id: contato.id }),
      fornecedor_id: fornecedorId,
      nome,
      ...(email && { email }),
      ...(whatsapp && { whatsapp }),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{contato ? "Editar Contato" : "Novo Contato"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="field-label">
              Nome<span className="required-asterisk">*</span>
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do contato"
              className={errors.nome ? "border-destructive" : ""}
            />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="field-label">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="field-label">
              WhatsApp
            </Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
