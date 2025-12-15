import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Mail, Eye } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFornecedores, Fornecedor } from "@/hooks/useFornecedores";
import { FornecedorModal } from "@/components/modals/FornecedorModal";
import { SendFeedbackDialog } from "@/components/feedback/SendFeedbackDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Fornecedores() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [feedbackFornecedor, setFeedbackFornecedor] = useState<Fornecedor | null>(null);

  const { 
    fornecedores, 
    isLoading, 
    createFornecedor, 
    updateFornecedor, 
    toggleSituacao,
    isCreating,
    isUpdating 
  } = useFornecedores();

  const filtered = fornecedores.filter(
    (f) =>
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.codigo.toLowerCase().includes(search.toLowerCase()) ||
      f.cnpj.includes(search)
  );

  const handleSave = (data: { id?: string; codigo: string; nome: string; cnpj: string; endereco?: string }) => {
    if (data.id) {
      updateFornecedor(data as { id: string; codigo: string; nome: string; cnpj: string; endereco?: string });
    } else {
      createFornecedor({ codigo: data.codigo, nome: data.nome, cnpj: data.cnpj, endereco: data.endereco });
    }
    setEditingFornecedor(null);
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingFornecedor(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Fornecedores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os fornecedores cadastrados
          </p>
        </div>
        <Button onClick={handleNew}>
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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              filtered.map((fornecedor) => (
                <TableRow key={fornecedor.id} className="h-12">
                  <TableCell className="font-medium text-primary">
                    {fornecedor.codigo}
                  </TableCell>
                  <TableCell>{fornecedor.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {fornecedor.cnpj}
                  </TableCell>
                  <TableCell className="text-center">{fornecedor.total_avaliacoes}</TableCell>
                  <TableCell className="text-center">
                    <ScoreBadge score={Number(fornecedor.score_atual)} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/fornecedores/${fornecedor.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(fornecedor)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/qualificacoes?nova=true')}>
                          <Plus className="mr-2 h-4 w-4" />
                          Nova Qualificação
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setFeedbackFornecedor(fornecedor)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Enviar Feedback
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleSituacao({ id: fornecedor.id, situacao: fornecedor.situacao })}
                          className="text-destructive"
                        >
                          {fornecedor.situacao === "ativo" ? "Inativar" : "Ativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum fornecedor encontrado
          </div>
        )}
      </div>

      <FornecedorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        fornecedor={editingFornecedor}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />

      <SendFeedbackDialog
        open={!!feedbackFornecedor}
        onOpenChange={(open) => !open && setFeedbackFornecedor(null)}
        fornecedor={feedbackFornecedor}
      />
    </div>
  );
}
