"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTransaction } from "@/app/actions";

interface TransactionActionsProps {
  transaction: any;
}

export function TransactionActions({ transaction }: TransactionActionsProps) {
  async function handleDelete() {
    if (!confirm("Excluir esta transação?")) return;
    try {
      await deleteTransaction(transaction.id);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      title="Excluir"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
