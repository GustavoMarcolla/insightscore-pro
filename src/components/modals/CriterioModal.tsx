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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CriterioWithGrupo } from "@/hooks/useCriterios";
import { Grupo } from "@/hooks/useGrupos";

const criterioSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório").max(20, "Máximo 20 caracteres"),
  descricao: z.string().min(1, "Descrição é obrigatória").max(100, "Máximo 100 caracteres"),
});

interface CriterioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criterio?: CriterioWithGrupo | null;
  grupos: Grupo[];
  onSave: (data: { id?: string; codigo: string; descricao: string; grupo_id?: string }) => void;
  isLoading?: boolean;
}

export function CriterioModal({ open, onOpenChange, criterio, grupos, onSave, isLoading }: CriterioModalProps) {
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [grupoId, setGrupoId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (criterio) {
      setCodigo(criterio.codigo);
      setDescricao(criterio.descricao);
      setGrupoId(criterio.grupo_id || "");
    } else {
      setCodigo("");
      setDescricao("");
      setGrupoId("");
    }
    setErrors({});
  }, [criterio, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = criterioSchema.safeParse({ codigo, descricao });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSave({
      ...(criterio && { id: criterio.id }),
      codigo,
      descricao,
      ...(grupoId && { grupo_id: grupoId }),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{criterio ? "Editar Critério" : "Novo Critério"}</DialogTitle>
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
              placeholder="CRT001"
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
              placeholder="Nome do critério"
              className={errors.descricao ? "border-destructive" : ""}
            />
            {errors.descricao && <p className="text-sm text-destructive">{errors.descricao}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="grupo" className="field-label">
              Grupo de Qualificação
            </Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {grupos.filter((g) => g.situacao === "ativo").map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
