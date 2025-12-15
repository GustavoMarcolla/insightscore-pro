import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, FileText, Calendar } from "lucide-react";
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
const qualificacoes = [
  { 
    id: "1", 
    fornecedor: "Fornecedor Alpha Ltda", 
    notaFiscal: "NF-2024-001234", 
    dataRecebimento: "2024-01-15", 
    score: 95,
    criteriosAvaliados: 8
  },
  { 
    id: "2", 
    fornecedor: "Tech Solutions S.A.", 
    notaFiscal: "NF-2024-001235", 
    dataRecebimento: "2024-01-14", 
    score: 88,
    criteriosAvaliados: 6
  },
  { 
    id: "3", 
    fornecedor: "Industrial Parts Co.", 
    notaFiscal: "NF-2024-001236", 
    dataRecebimento: "2024-01-13", 
    score: 72,
    criteriosAvaliados: 7
  },
  { 
    id: "4", 
    fornecedor: "Quality Materials", 
    notaFiscal: "NF-2024-001237", 
    dataRecebimento: "2024-01-12", 
    score: 65,
    criteriosAvaliados: 5
  },
  { 
    id: "5", 
    fornecedor: "Basic Supplies", 
    notaFiscal: "NF-2024-001238", 
    dataRecebimento: "2024-01-11", 
    score: 55,
    criteriosAvaliados: 8
  },
];

export default function Qualificacoes() {
  const [search, setSearch] = useState("");

  const filtered = qualificacoes.filter(
    (q) =>
      q.fornecedor.toLowerCase().includes(search.toLowerCase()) ||
      q.notaFiscal.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Qualificações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico de qualificações realizadas
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Qualificação
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
              placeholder="Buscar por fornecedor ou nota fiscal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Período
          </Button>
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
              <TableHead className="font-semibold">Fornecedor</TableHead>
              <TableHead className="font-semibold">Nota Fiscal</TableHead>
              <TableHead className="font-semibold">Data Recebimento</TableHead>
              <TableHead className="font-semibold text-center">Critérios</TableHead>
              <TableHead className="font-semibold text-center">Score</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((qualificacao) => (
              <TableRow key={qualificacao.id} className="h-12">
                <TableCell className="font-medium">{qualificacao.fornecedor}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="h-4 w-4" />
                    {qualificacao.notaFiscal}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(qualificacao.dataRecebimento)}
                </TableCell>
                <TableCell className="text-center">
                  {qualificacao.criteriosAvaliados}
                </TableCell>
                <TableCell className="text-center">
                  <ScoreBadge score={qualificacao.score} size="sm" />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Visualizar Detalhes</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Enviar ao Fornecedor</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Excluir
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
            Nenhuma qualificação encontrada
          </div>
        )}
      </div>
    </div>
  );
}
