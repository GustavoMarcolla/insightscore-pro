import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { useTableSort } from "@/hooks/useTableSort";
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
import { useCriterios, CriterioWithGrupo } from "@/hooks/useCriterios";
import { useGrupos } from "@/hooks/useGrupos";
import { CriterioModal } from "@/components/modals/CriterioModal";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";

export default function Criterios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [grupoFilter, setGrupoFilter] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCriterio, setEditingCriterio] = useState<CriterioWithGrupo | null>(null);

  const { 
    criterios, 
    isLoading, 
    createCriterio, 
    updateCriterio, 
    toggleSituacao,
    isCreating,
    isUpdating 
  } = useCriterios();

  const { grupos } = useGrupos();

  // Filter by grupo when coming from grupos page
  useEffect(() => {
    const grupoId = searchParams.get('grupo');
    if (grupoId && grupos.length > 0) {
      const grupo = grupos.find(g => g.id === grupoId);
      if (grupo) {
        setGrupoFilter(grupo.descricao);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, grupos, setSearchParams]);

  const gruposOptions = ["Todos", ...new Set(criterios.map((c) => c.grupo_descricao).filter(Boolean))];

  const filtered = criterios.filter((c) => {
    const matchSearch =
      c.descricao.toLowerCase().includes(search.toLowerCase()) ||
      c.codigo.toLowerCase().includes(search.toLowerCase());
    const matchGrupo = grupoFilter === "Todos" || c.grupo_descricao === grupoFilter;
    return matchSearch && matchGrupo;
  });

  const { sortedItems, sortConfig, requestSort } = useTableSort(filtered, "codigo", "asc");

  const { totalItems, totalPages, getPaginatedItems, itemsPerPage } = usePagination(sortedItems, 10);
  const paginatedItems = getPaginatedItems(currentPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, grupoFilter]);

  const handleSave = (data: { id?: string; codigo: string; descricao: string; grupo_id?: string }) => {
    if (data.id) {
      updateCriterio(data as { id: string; codigo: string; descricao: string; grupo_id?: string });
    } else {
      createCriterio({ codigo: data.codigo, descricao: data.descricao, grupo_id: data.grupo_id });
    }
    setEditingCriterio(null);
  };

  const handleEdit = (criterio: CriterioWithGrupo) => {
    setEditingCriterio(criterio);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingCriterio(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Critérios de Qualificação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Defina os critérios de avaliação dos fornecedores
          </p>
        </div>
        <Button onClick={handleNew}>
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
              {gruposOptions.map((g) => (
                <SelectItem key={g} value={g as string}>
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
              <SortableTableHead
                sortKey="codigo"
                currentSortKey={sortConfig.key as string}
                sortDirection={sortConfig.direction}
                onSort={(key) => requestSort(key as keyof CriterioWithGrupo)}
              >
                Código
              </SortableTableHead>
              <SortableTableHead
                sortKey="descricao"
                currentSortKey={sortConfig.key as string}
                sortDirection={sortConfig.direction}
                onSort={(key) => requestSort(key as keyof CriterioWithGrupo)}
              >
                Descrição
              </SortableTableHead>
              <SortableTableHead
                sortKey="grupo_descricao"
                currentSortKey={sortConfig.key as string}
                sortDirection={sortConfig.direction}
                onSort={(key) => requestSort(key as keyof CriterioWithGrupo)}
              >
                Grupo
              </SortableTableHead>
              <SortableTableHead
                sortKey="situacao"
                currentSortKey={sortConfig.key as string}
                sortDirection={sortConfig.direction}
                onSort={(key) => requestSort(key as keyof CriterioWithGrupo)}
                className="text-center"
              >
                Situação
              </SortableTableHead>
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
                  <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              paginatedItems.map((criterio) => (
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
                    {criterio.grupo_descricao || "-"}
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
                        <DropdownMenuItem onClick={() => handleEdit(criterio)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleSituacao({ id: criterio.id, situacao: criterio.situacao })}
                          className="text-destructive"
                        >
                          {criterio.situacao === "ativo" ? "Inativar" : "Ativar"}
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
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum critério encontrado
          </div>
        )}
      </div>

      <CriterioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        criterio={editingCriterio}
        grupos={grupos}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}
