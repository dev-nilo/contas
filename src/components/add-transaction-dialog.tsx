"use client";

import { useState, useEffect } from "react";
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
  defaultType = "Despesa",
}: {
  defaultType?: "Receita" | "Despesa";
}) {
  const [open, setOpen] = useState(false);
  const [parcelTotal, setParcelTotal] = useState("1");

  useEffect(() => {
    if (open) setParcelTotal("1");
  }, [open]);

  async function handleSubmit(formData: FormData) {
    try {
      await addTransaction(formData);
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            className={`gap-2 ${defaultType === "Receita" ? "bg-green-300 hover:bg-green-500 text-white border-0" : "bg-red-400 hover:bg-red-500 text-white border-0"}`}
          >
            <Plus className="h-4 w-4" />
            {defaultType === "Receita" ? "Entrada" : "Saída"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Nova {defaultType === "Receita" ? "Entrada" : "Saída"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <input
            type="hidden"
            name="type"
            value={defaultType === "Receita" ? "INCOME" : "EXPENSE"}
          />
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
            <Label htmlFor="responsible">Responsável</Label>
            <Input
              id="responsible"
              name="responsible"
              placeholder="Ex: Nilo"
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

          {defaultType === "Despesa" && (
            <div className="grid gap-2">
              <Label htmlFor="installments">Nº de parcelas</Label>
              <Input
                id="installments"
                name="installments"
                type="number"
                min={1}
                value={parcelTotal}
                onChange={(e) => setParcelTotal(e.target.value)}
                required
              />
              {Math.max(1, parseInt(parcelTotal, 10) || 1) > 1 ? (
                <div className="grid gap-2">
                  <Label htmlFor="installmentsPaid">Parcelas já pagas</Label>
                  <Input
                    id="installmentsPaid"
                    name="installmentsPaid"
                    type="number"
                    min={0}
                    max={Math.max(1, parseInt(parcelTotal, 10) || 1)}
                    defaultValue="0"
                  />
                </div>
              ) : (
                <input type="hidden" name="installmentsPaid" value="0" />
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select name="category" defaultValue="Outros">
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {defaultType === "Receita" ? (
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
