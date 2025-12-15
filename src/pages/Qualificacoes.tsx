import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, FileText, Eye } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDocumentos } from "@/hooks/useDocumentos";
import { QualificacaoWizard } from "@/components/qualificacao/QualificacaoWizard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Qualificacoes() {
  const [search, setSearch] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const { documentos, isLoading } = useDocumentos();

  const filtered = documentos.filter(
    (d) =>
      d.fornecedor_nome.toLowerCase().includes(search.toLowerCase()) ||
      d.fornecedor_codigo.toLowerCase().includes(search.toLowerCase()) ||
      d.numero_nf?.includes(search) ||
      d.serie_nf?.includes(search)
  );

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
              placeholder="Buscar por fornecedor ou nota fiscal..."
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
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="font-semibold">Fornecedor</TableHead>
              <TableHead className="font-semibold">NF</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted" />
                  <p className="font-medium">Nenhuma qualificação encontrada</p>
                  <p className="text-sm mt-1">Clique em "Nova Qualificação" para começar</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((doc) => (
                <TableRow key={doc.id} className="h-12">
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        {doc.status === "pendente" && (
                          <DropdownMenuItem>Continuar Avaliação</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">
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
      </div>

      <QualificacaoWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />
    </div>
  );
}
