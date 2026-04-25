'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TransactionActions } from '@/components/transaction-actions'
import { Repeat, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteMultipleTransactions } from '@/app/actions'

interface TransactionTableProps {
  transactions: any[]
  monthName: string
}

export function TransactionTable({ transactions, monthName }: TransactionTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(transactions.map((t) => t.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (confirm(`Deseja excluir ${selectedIds.length} transações selecionadas?`)) {
      await deleteMultipleTransactions(selectedIds)
      setSelectedIds([])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold capitalize">Transações de {monthName}</h2>
        {selectedIds.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            className="gap-2 animate-in fade-in slide-in-from-top-1"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4" />
            Excluir {selectedIds.length} selecionados
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedIds.length === transactions.length && transactions.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[80px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhuma transação encontrada para este período.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id} className={selectedIds.includes(t.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(t.id)}
                      onCheckedChange={() => toggleSelect(t.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {t.category === 'Assinaturas' ? (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Repeat className="h-3 w-3" />
                        <span>Fixo</span>
                      </div>
                    ) : (
                      new Date(t.date).toLocaleDateString('pt-BR')
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {t.description}
                    {t.installments > 1 && (
                      <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {t.installments}x
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell className={`text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <TransactionActions transaction={t} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
