"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTransaction, deleteTransaction } from "@/app/actions";

interface TransactionActionsProps {
  transaction: any; // Using any for simplicity as discussed
}

export function TransactionActions({ transaction }: TransactionActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(transaction.type);

  async function handleUpdate(formData: FormData) {
    await updateTransaction(transaction.id, formData);
    setIsEditDialogOpen(false);
  }

  async function handleDelete() {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      await deleteTransaction(transaction.id);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setIsEditDialogOpen(true)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            className="gap-2 text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <form action={handleUpdate} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                defaultValue={transaction.description}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                defaultValue={transaction.amount}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  new Date(transaction.date).toISOString().split("T")[0]
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                name="type"
                defaultValue={type}
                onValueChange={(v) => setType(v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Receita</SelectItem>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "EXPENSE" && (
              <div className="grid gap-2">
                <Label htmlFor="installments">Parcelas</Label>
                <Input
                  id="installments"
                  name="installments"
                  type="number"
                  min="1"
                  defaultValue={transaction.installments || 1}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select name="category" defaultValue={transaction.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {type === "INCOME" ? (
                    <>
                      <SelectItem value="Salário">Salário</SelectItem>
                      <SelectItem value="Investimentos">
                        Investimentos
                      </SelectItem>
                      <SelectItem value="Presentes">Presentes</SelectItem>
                      <SelectItem value="Vendas">Vendas</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Moradia">Moradia</SelectItem>
                      <SelectItem value="Lazer">Lazer</SelectItem>
                      <SelectItem value="Transporte">Transporte</SelectItem>
                      <SelectItem value="Saúde">Saúde</SelectItem>
                      <SelectItem value="Educação">Educação</SelectItem>
                      <SelectItem value="Assinaturas">Assinaturas</SelectItem>
                      <SelectItem value="Cuidado Pessoal">
                        Cuidado Pessoal
                      </SelectItem>
                      <SelectItem value="Pets">Pets</SelectItem>
                      <SelectItem value="Lanches">Lanches</SelectItem>
                      <SelectItem value="Supermercado">Supermercado</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="mt-4">
              Salvar Alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
