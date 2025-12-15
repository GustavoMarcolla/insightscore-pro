import { useState } from "react";
import { Plus, Search, MoreHorizontal, FolderTree } from "lucide-react";
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

// Mock data
const grupos = [
  { id: "1", codigo: "GQ001", descricao: "Matéria Prima", criterios: 8, situacao: "ativo" },
  { id: "2", codigo: "GQ002", descricao: "Serviços de Manutenção", criterios: 6, situacao: "ativo" },
  { id: "3", codigo: "GQ003", descricao: "Embalagens", criterios: 5, situacao: "ativo" },
  { id: "4", codigo: "GQ004", descricao: "Transporte e Logística", criterios: 7, situacao: "ativo" },
  { id: "5", codigo: "GQ005", descricao: "Equipamentos", criterios: 4, situacao: "inativo" },
];

export default function Grupos() {
  const [search, setSearch] = useState("");

  const filtered = grupos.filter(
    (g) =>
      g.descricao.toLowerCase().includes(search.toLowerCase()) ||
      g.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Grupos de Qualificação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize os critérios em grupos temáticos
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Grupo
        </Button>
      </div>

      {/* Filters Card */}
      <div className="card-section">
        <div className="card-header-section">
          <h2 className="section-title">Filtros</h2>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="card-section p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="font-semibold">Código</TableHead>
              <TableHead className="font-semibold">Descrição</TableHead>
              <TableHead className="font-semibold text-center">Critérios</TableHead>
              <TableHead className="font-semibold text-center">Situação</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((grupo) => (
              <TableRow key={grupo.id} className="h-12">
                <TableCell className="font-medium text-primary">
                  {grupo.codigo}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                    {grupo.descricao}
                  </div>
                </TableCell>
                <TableCell className="text-center">{grupo.criterios}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={grupo.situacao === "ativo" ? "default" : "secondary"}
                    className={
                      grupo.situacao === "ativo"
                        ? "bg-success text-success-foreground"
                        : ""
                    }
                  >
                    {grupo.situacao === "ativo" ? "Ativo" : "Inativo"}
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
                      <DropdownMenuItem>Ver Critérios</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        {grupo.situacao === "ativo" ? "Inativar" : "Ativar"}
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
            Nenhum grupo encontrado
          </div>
        )}
      </div>
    </div>
  );
}
