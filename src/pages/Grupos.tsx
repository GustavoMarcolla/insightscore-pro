import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useGrupos, GrupoWithCount } from "@/hooks/useGrupos";
import { GrupoModal } from "@/components/modals/GrupoModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function Grupos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoWithCount | null>(null);

  const { 
    gruposWithCount, 
    isLoading, 
    createGrupo, 
    updateGrupo, 
    toggleSituacao,
    isCreating,
    isUpdating 
  } = useGrupos();

  const filtered = gruposWithCount.filter(
    (g) =>
      g.descricao.toLowerCase().includes(search.toLowerCase()) ||
      g.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: { id?: string; codigo: string; descricao: string }) => {
    if (data.id) {
      updateGrupo(data as { id: string; codigo: string; descricao: string });
    } else {
      createGrupo({ codigo: data.codigo, descricao: data.descricao });
    }
    setEditingGrupo(null);
  };

  const handleEdit = (grupo: GrupoWithCount) => {
    setEditingGrupo(grupo);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingGrupo(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Grupos de Qualificação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize os critérios em grupos temáticos
          </p>
        </div>
        <Button onClick={handleNew}>
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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              filtered.map((grupo) => (
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
                  <TableCell className="text-center">{grupo.criterios_count}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEdit(grupo)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/criterios?grupo=${grupo.id}`)}>
                          <FolderTree className="mr-2 h-4 w-4" />
                          Ver Critérios
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleSituacao({ id: grupo.id, situacao: grupo.situacao })}
                          className="text-destructive"
                        >
                          {grupo.situacao === "ativo" ? "Inativar" : "Ativar"}
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
            Nenhum grupo encontrado
          </div>
        )}
      </div>

      <GrupoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        grupo={editingGrupo}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}
