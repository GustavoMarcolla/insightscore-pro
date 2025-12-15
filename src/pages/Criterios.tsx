import { useState } from "react";
import { Plus, Search, MoreHorizontal, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const criterios = [
  { id: "1", codigo: "CRT001", descricao: "Qualidade do Produto", grupo: "Matéria Prima", situacao: "ativo" },
  { id: "2", codigo: "CRT002", descricao: "Prazo de Entrega", grupo: "Matéria Prima", situacao: "ativo" },
  { id: "3", codigo: "CRT003", descricao: "Documentação Completa", grupo: "Matéria Prima", situacao: "ativo" },
  { id: "4", codigo: "CRT004", descricao: "Embalagem Adequada", grupo: "Matéria Prima", situacao: "ativo" },
  { id: "5", codigo: "CRT005", descricao: "Atendimento ao Chamado", grupo: "Serviços de Manutenção", situacao: "ativo" },
  { id: "6", codigo: "CRT006", descricao: "Tempo de Resposta", grupo: "Serviços de Manutenção", situacao: "ativo" },
  { id: "7", codigo: "CRT007", descricao: "Conformidade com Especificação", grupo: "Embalagens", situacao: "inativo" },
];

const grupos = ["Todos", "Matéria Prima", "Serviços de Manutenção", "Embalagens"];

export default function Criterios() {
  const [search, setSearch] = useState("");
  const [grupoFilter, setGrupoFilter] = useState("Todos");

  const filtered = criterios.filter((c) => {
    const matchSearch =
      c.descricao.toLowerCase().includes(search.toLowerCase()) ||
      c.codigo.toLowerCase().includes(search.toLowerCase());
    const matchGrupo = grupoFilter === "Todos" || c.grupo === grupoFilter;
    return matchSearch && matchGrupo;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Critérios de Qualificação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Defina os critérios de avaliação dos fornecedores
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Critério
        </Button>
      </div>

      {/* Filters Card */}
      <div className="card-section">
        <div className="card-header-section">
          <h2 className="section-title">Filtros</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={grupoFilter} onValueChange={setGrupoFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Grupo" />
            </SelectTrigger>
            <SelectContent>
              {grupos.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Card */}
      <div className="card-section p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="font-semibold">Código</TableHead>
              <TableHead className="font-semibold">Descrição</TableHead>
              <TableHead className="font-semibold">Grupo</TableHead>
              <TableHead className="font-semibold text-center">Situação</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((criterio) => (
              <TableRow key={criterio.id} className="h-12">
                <TableCell className="font-medium text-primary">
                  {criterio.codigo}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    {criterio.descricao}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {criterio.grupo}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={criterio.situacao === "ativo" ? "default" : "secondary"}
                    className={
                      criterio.situacao === "ativo"
                        ? "bg-success text-success-foreground"
                        : ""
                    }
                  >
                    {criterio.situacao === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        {criterio.situacao === "ativo" ? "Inativar" : "Ativar"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum critério encontrado
          </div>
        )}
      </div>
    </div>
  );
}
