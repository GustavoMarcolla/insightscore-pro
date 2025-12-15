import { useState } from "react";
import { Plus, MoreHorizontal, Mail, Phone, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useFornecedorContatos, FornecedorContato } from "@/hooks/useFornecedorContatos";
import { ContatoModal } from "@/components/modals/ContatoModal";

interface ContatosSectionProps {
  fornecedorId: string;
}

export function ContatosSection({ fornecedorId }: ContatosSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContato, setEditingContato] = useState<FornecedorContato | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    contatos,
    isLoading,
    createContato,
    updateContato,
    deleteContato,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFornecedorContatos(fornecedorId);

  const handleSave = (data: { id?: string; fornecedor_id: string; nome: string; email?: string; whatsapp?: string }) => {
    if (data.id) {
      updateContato({ id: data.id, nome: data.nome, email: data.email, whatsapp: data.whatsapp });
    } else {
      createContato({ fornecedor_id: data.fornecedor_id, nome: data.nome, email: data.email, whatsapp: data.whatsapp });
    }
    setEditingContato(null);
  };

  const handleEdit = (contato: FornecedorContato) => {
    setEditingContato(contato);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingContato(null);
    setModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteContato(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold">Contatos</CardTitle>
          <Button size="sm" onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Contato
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">E-mail</TableHead>
                <TableHead className="font-semibold">WhatsApp</TableHead>
                <TableHead className="font-semibold text-right w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : contatos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Nenhum contato cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                contatos.map((contato) => (
                  <TableRow key={contato.id}>
                    <TableCell className="font-medium">{contato.nome}</TableCell>
                    <TableCell>
                      {contato.email ? (
                        <a 
                          href={`mailto:${contato.email}`} 
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {contato.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contato.whatsapp ? (
                        <a 
                          href={`https://wa.me/${contato.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {contato.whatsapp}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(contato)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(contato.id)}
                            className="text-destructive"
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
        </CardContent>
      </Card>

      <ContatoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contato={editingContato}
        fornecedorId={fornecedorId}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contato será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
