import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScoreBadge } from "@/components/ui/score-badge";
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
const fornecedores = [
  { id: "1", codigo: "FOR001", nome: "Fornecedor Alpha Ltda", cnpj: "12.345.678/0001-90", score: 95, avaliacoes: 24 },
  { id: "2", codigo: "FOR002", nome: "Tech Solutions S.A.", cnpj: "23.456.789/0001-01", score: 92, avaliacoes: 18 },
  { id: "3", codigo: "FOR003", nome: "Industrial Parts Co.", cnpj: "34.567.890/0001-12", score: 88, avaliacoes: 32 },
  { id: "4", codigo: "FOR004", nome: "Quality Materials", cnpj: "45.678.901/0001-23", score: 75, avaliacoes: 15 },
  { id: "5", codigo: "FOR005", nome: "Express Delivery Inc.", cnpj: "56.789.012/0001-34", score: 68, avaliacoes: 21 },
  { id: "6", codigo: "FOR006", nome: "Basic Supplies", cnpj: "67.890.123/0001-45", score: 55, avaliacoes: 12 },
];

export default function Fornecedores() {
  const [search, setSearch] = useState("");

  const filtered = fornecedores.filter(
    (f) =>
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.codigo.toLowerCase().includes(search.toLowerCase()) ||
      f.cnpj.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Fornecedores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os fornecedores cadastrados
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
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
              placeholder="Buscar por nome, código ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Mais Filtros
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card-section p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="font-semibold">Código</TableHead>
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">CNPJ</TableHead>
              <TableHead className="font-semibold text-center">Avaliações</TableHead>
              <TableHead className="font-semibold text-center">Score</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((fornecedor) => (
              <TableRow key={fornecedor.id} className="h-12">
                <TableCell className="font-medium text-primary">
                  {fornecedor.codigo}
                </TableCell>
                <TableCell>{fornecedor.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {fornecedor.cnpj}
                </TableCell>
                <TableCell className="text-center">{fornecedor.avaliacoes}</TableCell>
                <TableCell className="text-center">
                  <ScoreBadge score={fornecedor.score} size="sm" />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Visualizar</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Nova Qualificação</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Inativar
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
            Nenhum fornecedor encontrado
          </div>
        )}
      </div>
    </div>
  );
}
