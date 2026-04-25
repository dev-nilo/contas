"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { addTransaction } from "@/app/actions";

export function AddTransactionDialog({
  defaultType = "EXPENSE",
}: {
  defaultType?: "INCOME" | "EXPENSE";
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"INCOME" | "EXPENSE">(defaultType);

  async function handleSubmit(formData: FormData) {
    await addTransaction(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            className={`gap-2 ${defaultType === "INCOME" ? "bg-green-300 hover:bg-green-500 text-white border-0" : "bg-red-400 hover:bg-red-500 text-white border-0"}`}
          >
            <Plus className="h-4 w-4" />
            {defaultType === "INCOME" ? "Entrada" : "Saída"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Nova {defaultType === "INCOME" ? "Entrada" : "Saída"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="type" value={defaultType} />
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ex: Mercado, Salário..."
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
              placeholder="0.00"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {defaultType === "EXPENSE" && (
            <div className="grid gap-2">
              <Label htmlFor="installments">Parcelas</Label>
              <Input
                id="installments"
                name="installments"
                type="number"
                min="1"
                defaultValue="1"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select name="category" defaultValue="Outros">
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {defaultType === "INCOME" ? (
                  <>
                    <SelectItem value="Salário">Salário</SelectItem>
                    <SelectItem value="Investimentos">Investimentos</SelectItem>
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
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
