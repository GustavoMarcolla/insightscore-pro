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
import { Grupo } from "@/hooks/useGrupos";

const grupoSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório").max(20, "Máximo 20 caracteres"),
  descricao: z.string().min(1, "Descrição é obrigatória").max(100, "Máximo 100 caracteres"),
});

interface GrupoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupo?: Grupo | null;
  onSave: (data: { id?: string; codigo: string; descricao: string }) => void;
  isLoading?: boolean;
}

export function GrupoModal({ open, onOpenChange, grupo, onSave, isLoading }: GrupoModalProps) {
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (grupo) {
      setCodigo(grupo.codigo);
      setDescricao(grupo.descricao);
    } else {
      setCodigo("");
      setDescricao("");
    }
    setErrors({});
  }, [grupo, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = grupoSchema.safeParse({ codigo, descricao });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSave({
      ...(grupo && { id: grupo.id }),
      codigo,
      descricao,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{grupo ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="codigo" className="field-label">
              Código<span className="required-asterisk">*</span>
            </Label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="GQ001"
              className={errors.codigo ? "border-destructive" : ""}
            />
            {errors.codigo && <p className="text-sm text-destructive">{errors.codigo}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao" className="field-label">
              Descrição<span className="required-asterisk">*</span>
            </Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Nome do grupo"
              className={errors.descricao ? "border-destructive" : ""}
            />
            {errors.descricao && <p className="text-sm text-destructive">{errors.descricao}</p>}
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
