import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, MoreHorizontal, FileText, Eye, Trash2, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { useTableSort } from "@/hooks/useTableSort";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDocumentos } from "@/hooks/useDocumentos";
import { QualificacaoWizard } from "@/components/qualificacao/QualificacaoWizard";
import { ContinuarAvaliacaoWizard } from "@/components/qualificacao/ContinuarAvaliacaoWizard";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";

export default function Qualificacoes() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [continuarOpen, setContinuarOpen] = useState(false);
  const [selectedDocumentoId, setSelectedDocumentoId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentoToDelete, setDocumentoToDelete] = useState<string | null>(null);
  const [preselectedFornecedor, setPreselectedFornecedor] = useState<string | undefined>();

  // Open wizard if coming from fornecedores with ?nova=true
  useEffect(() => {
    if (searchParams.get('nova') === 'true') {
      const fornecedorId = searchParams.get('fornecedor') || undefined;
      setPreselectedFornecedor(fornecedorId);
      setWizardOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { documentos, isLoading, deleteDocumento, isDeleting } = useDocumentos();

  const filtered = documentos.filter(
    (d) =>
      d.fornecedor_nome.toLowerCase().includes(search.toLowerCase()) ||
      d.fornecedor_codigo.toLowerCase().includes(search.toLowerCase()) ||
      d.numero_nf?.includes(search) ||
      d.serie_nf?.includes(search) ||
      String(d.codigo).includes(search)
  );

  const { sortedItems, sortConfig, requestSort } = useTableSort(filtered, "codigo", "desc");

  const { totalItems, totalPages, getPaginatedItems, itemsPerPage } = usePagination(sortedItems, 10);
  const paginatedItems = getPaginatedItems(currentPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleContinuar = (documentoId: string) => {
    setSelectedDocumentoId(documentoId);
    setContinuarOpen(true);
  };

  const handleDeleteClick = (documentoId: string) => {
    setDocumentoToDelete(documentoId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (documentoToDelete) {
      deleteDocumento(documentoToDelete);
      setDeleteDialogOpen(false);
      setDocumentoToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Qualificações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as avaliações de recebimento
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
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
              placeholder="Buscar por código, fornecedor ou nota fiscal..."
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
              <SortableTableHead
                sortKey="codigo"
                currentSortKey={sortConfig.key as string}
                sortDirection={sortConfig.direction}
                onSort={(key) => requestSort(key as keyof typeof filtered[0])}
                className="w-24"
              >
                Código
              </SortableTableHead>
              <SortableTableHead
                sortKey="data_recebimento"
                currentSortKey={sortConfig.key as string}
                sortDirection={sortConfig.direction}
                onSort={(key) => requestSort(key as keyof typeof filtered[0])}
              >
                Data
              </SortableTableHead>
              <SortableTableHead
                sortKey="fornecedor_nome"
                currentSortKey={sortConfig.key as string}
                sortDirection={sortConfig.direction}
                onSort={(key) => requestSort(key as keyof typeof filtered[0])}
              >
                Fornecedor
              </SortableTableHead>
              <SortableTableHead
                sortKey="numero_nf"
                currentSortKey={sortConfig.key as string}
                sortDirection={sortConfig.direction}
                onSort={(key) => requestSort(key as keyof typeof filtered[0])}
              >
                NF
              </SortableTableHead>
              <SortableTableHead
                sortKey="status"
                currentSortKey={sortConfig.key as string}
                sortDirection={sortConfig.direction}
                onSort={(key) => requestSort(key as keyof typeof filtered[0])}
                className="text-center"
              >
                Status
              </SortableTableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted" />
                  <p className="font-medium">Nenhuma qualificação encontrada</p>
                  <p className="text-sm mt-1">Clique em "Nova Qualificação" para começar</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((doc) => (
                <TableRow key={doc.id} className="h-12">
                  <TableCell>
                    <span className="font-mono text-sm font-medium text-primary">
                      #{String(doc.codigo).padStart(5, '0')}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {format(new Date(doc.data_recebimento), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{doc.fornecedor_nome}</p>
                      <p className="text-xs text-muted-foreground">{doc.fornecedor_codigo}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.serie_nf || doc.numero_nf ? (
                      <>
                        {doc.serie_nf && `Série ${doc.serie_nf} - `}
                        Nº {doc.numero_nf || "-"}
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={doc.status === "concluido" ? "default" : "secondary"}
                      className={
                        doc.status === "concluido"
                          ? "bg-success text-success-foreground"
                          : ""
                      }
                    >
                      {doc.status === "concluido" ? "Concluído" : "Pendente"}
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
                        <DropdownMenuItem onClick={() => navigate(`/qualificacoes/${doc.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        {doc.status === "pendente" && (
                          <DropdownMenuItem onClick={() => handleContinuar(doc.id)}>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Continuar Avaliação
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteClick(doc.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <QualificacaoWizard
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) setPreselectedFornecedor(undefined);
        }}
        preselectedFornecedorId={preselectedFornecedor}
      />

      {selectedDocumentoId && (
        <ContinuarAvaliacaoWizard
          open={continuarOpen}
          onOpenChange={(open) => {
            setContinuarOpen(open);
            if (!open) setSelectedDocumentoId(null);
          }}
          documentoId={selectedDocumentoId}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta qualificação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
