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
import { Fornecedor } from "@/hooks/useFornecedores";

const fornecedorSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório").max(20, "Máximo 20 caracteres"),
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  cnpj: z.string().min(1, "CNPJ é obrigatório").max(20, "Máximo 20 caracteres"),
});

interface FornecedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor?: Fornecedor | null;
  onSave: (data: { id?: string; codigo: string; nome: string; cnpj: string; endereco?: string }) => void;
  isLoading?: boolean;
}

export function FornecedorModal({ open, onOpenChange, fornecedor, onSave, isLoading }: FornecedorModalProps) {
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (fornecedor) {
      setCodigo(fornecedor.codigo);
      setNome(fornecedor.nome);
      setCnpj(fornecedor.cnpj);
      setEndereco(fornecedor.endereco || "");
    } else {
      setCodigo("");
      setNome("");
      setCnpj("");
      setEndereco("");
    }
    setErrors({});
  }, [fornecedor, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = fornecedorSchema.safeParse({ codigo, nome, cnpj });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSave({
      ...(fornecedor && { id: fornecedor.id }),
      codigo,
      nome,
      cnpj,
      ...(endereco && { endereco }),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{fornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo" className="field-label">
                Código<span className="required-asterisk">*</span>
              </Label>
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="FOR001"
                className={errors.codigo ? "border-destructive" : ""}
              />
              {errors.codigo && <p className="text-sm text-destructive">{errors.codigo}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="field-label">
                CNPJ<span className="required-asterisk">*</span>
              </Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className={errors.cnpj ? "border-destructive" : ""}
              />
              {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome" className="field-label">
              Nome<span className="required-asterisk">*</span>
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do fornecedor"
              className={errors.nome ? "border-destructive" : ""}
            />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco" className="field-label">
              Endereço
            </Label>
            <Input
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Endereço completo"
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
