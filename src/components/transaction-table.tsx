'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionActions } from '@/components/transaction-actions'
import { Check, Pencil, Repeat, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteMultipleTransactions, updateTransaction } from '@/app/actions'

interface TransactionTableProps {
  transactions: any[]
  monthName: string
}

type TransactionDraft = {
  description: string
  responsible: string
  amount: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  installments: string
  installmentsPaid: string
  date: string
}

function installmentTotal(draft: TransactionDraft) {
  return Math.max(1, parseInt(draft.installments, 10) || 1)
}

function isParcelada(draft: TransactionDraft) {
  return draft.type === 'EXPENSE' && installmentTotal(draft) > 1
}

function installmentTotalFromTx(t: any) {
  return Math.max(1, Number(t.installments ?? 1))
}

export function TransactionTable({ transactions, monthName }: TransactionTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [drafts, setDrafts] = useState<Record<string, TransactionDraft>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentDescription = searchParams.get('description') || ''
  const currentCategory = searchParams.get('category') || 'all'
  const currentOrderBy = searchParams.get('orderBy') || 'date'
  const currentOrder = searchParams.get('order') || 'desc'
  const categories = Array.from(new Set(transactions.map((t) => t.category))).sort()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all' || value.trim() === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    router.push(`/?${params.toString()}`)
  }

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
      try {
        await deleteMultipleTransactions(selectedIds)
        setSelectedIds([])
      } catch (err) {
        console.error(err)
        alert(err instanceof Error ? err.message : 'Não foi possível excluir.')
      }
    }
  }

  const getInitialDraft = (transaction: any): TransactionDraft => {
    const type: 'INCOME' | 'EXPENSE' =
      transaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE'
    const installments = Math.max(1, Number(transaction.installments ?? 1))
    let paid = Number(transaction.installmentsPaid ?? 0)
    if (!Number.isFinite(paid)) paid = 0
    paid = Math.min(Math.max(0, paid), installments)

    return {
      description: transaction.description ?? '',
      responsible: transaction.responsible ?? '',
      amount: String(transaction.amount ?? ''),
      type,
      category: transaction.category ?? '',
      installments: String(installments),
      installmentsPaid: String(paid),
      date: new Date(transaction.date).toISOString().split('T')[0],
    }
  }

  const getDraft = (transaction: any): TransactionDraft =>
    drafts[transaction.id] ?? getInitialDraft(transaction)

  const beginEdit = (transaction: any) => {
    setDrafts({ [transaction.id]: getInitialDraft(transaction) })
    setEditingId(transaction.id)
  }

  const cancelEdit = () => {
    if (!editingId) return
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[editingId]
      return next
    })
    setEditingId(null)
  }

  const updateDraftField = (
    id: string,
    transaction: any,
    field: keyof TransactionDraft,
    value: string
  ) => {
    setDrafts((prev) => {
      const base = prev[id] ?? getInitialDraft(transaction)
      const next = { ...base, [field]: value }

      if (field === 'installments') {
        const total = Math.max(1, parseInt(value, 10) || 1)
        next.installments = String(total)
        if (total <= 1) {
          next.installmentsPaid = '0'
        } else {
          let paid = parseInt(next.installmentsPaid, 10) || 0
          if (paid > total) paid = total
          next.installmentsPaid = String(paid)
        }
      }

      if (field === 'installmentsPaid') {
        const total = Math.max(1, parseInt(next.installments) || 1)
        let paid = parseInt(value) || 0
        paid = Math.min(Math.max(0, paid), total)
        next.installmentsPaid = String(paid)
      }

      if (field === 'type' && value === 'INCOME') {
        next.installments = '1'
        next.installmentsPaid = '0'
      }

      return { ...prev, [id]: next }
    })
  }

  const handleSaveRow = async (transaction: any) => {
    const draft = getDraft(transaction)
    if (!draft.description.trim() || !draft.responsible.trim() || !draft.category.trim() || !draft.date) return

    const formData = new FormData()
    formData.set('description', draft.description.trim())
    formData.set('responsible', draft.responsible.trim())
    formData.set('amount', draft.amount)
    formData.set('type', draft.type)
    formData.set('category', draft.category.trim())
    const totalParc = installmentTotal(draft)
    formData.set('installments', draft.type === 'EXPENSE' ? String(totalParc) : '1')
    formData.set(
      'installmentsPaid',
      draft.type === 'EXPENSE' && isParcelada(draft) ? draft.installmentsPaid : '0'
    )
    formData.set('date', draft.date)

    setSavingRowId(transaction.id)
    try {
      await updateTransaction(transaction.id, formData)
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[transaction.id]
        return next
      })
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSavingRowId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold capitalize">Transações de {monthName}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={currentDescription}
            onChange={(e) => updateFilter('description', e.target.value)}
            placeholder="Filtrar descrição"
            className="w-[190px]"
          />

          <Select
            value={currentCategory}
            onValueChange={(v) => {
              if (v != null && v !== '') updateFilter('category', v)
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentOrderBy}
            onValueChange={(v) => {
              if (v != null && v !== '') updateFilter('orderBy', v)
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="description">Descrição</SelectItem>
              <SelectItem value="category">Categoria</SelectItem>
              <SelectItem value="responsible">Responsável</SelectItem>
              <SelectItem value="amount">Valor</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currentOrder}
            onValueChange={(v) => {
              if (v != null && v !== '') updateFilter('order', v)
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ordem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Decrescente</SelectItem>
              <SelectItem value="asc">Crescente</SelectItem>
            </SelectContent>
          </Select>

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
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table className="w-full min-w-[920px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-2 align-middle" />
              <TableHead className="whitespace-nowrap w-[136px] align-middle py-2">
                Data
              </TableHead>
              <TableHead className="whitespace-nowrap w-[92px] px-1.5 align-middle">
                Tipo
              </TableHead>
              <TableHead className="min-w-0 w-[18%] align-middle">Descrição</TableHead>
              <TableHead className="min-w-0 w-[14%] align-middle">Categoria</TableHead>
              <TableHead className="min-w-0 w-[12%] align-middle">Resp.</TableHead>
              <TableHead className="whitespace-nowrap w-[108px] px-1 text-center align-middle">
                Parcelas
              </TableHead>
              <TableHead className="text-right whitespace-nowrap w-[104px] align-middle">
                Valor
              </TableHead>
              <TableHead className="w-[108px] text-right px-1 align-middle">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  Nenhuma transação encontrada para este período.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => {
                const isEditing = editingId === t.id
                const draft = getDraft(t)
                const isSaving = savingRowId === t.id
                const parcelada = isParcelada(draft)
                const totalTx = installmentTotalFromTx(t)
                const paidTx = Math.min(
                  Math.max(0, Number(t.installmentsPaid ?? 0)),
                  totalTx
                )

                return (
                  <TableRow
                    key={t.id}
                    className={selectedIds.includes(t.id) ? 'bg-muted/50' : ''}
                  >
                    <TableCell className="px-2 py-2 align-middle">
                      <div className="flex h-8 items-center justify-center">
                        <Checkbox
                          checked={selectedIds.includes(t.id)}
                          onCheckedChange={() => toggleSelect(t.id)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-2 align-middle whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex h-8 items-center gap-1.5">
                          {t.category === 'Assinaturas' && (
                            <span className="text-blue-600 shrink-0" title="Fixo / assinatura">
                              <Repeat className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <Input
                            type="date"
                            value={draft.date}
                            onChange={(e) => updateDraftField(t.id, t, 'date', e.target.value)}
                            className="h-8 w-full max-w-[130px] text-xs"
                          />
                        </div>
                      ) : (
                        <div className="flex h-8 items-center gap-1.5 text-sm">
                          {t.category === 'Assinaturas' ? (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Repeat className="h-3.5 w-3.5 shrink-0" />
                              Fixo
                            </span>
                          ) : (
                            <span className="tabular-nums">
                              {new Date(t.date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-1.5 align-middle">
                      {isEditing ? (
                        <Select
                          value={draft.type}
                          onValueChange={(value) => {
                            if (value !== 'INCOME' && value !== 'EXPENSE') return
                            updateDraftField(t.id, t, 'type', value)
                          }}
                        >
                          <SelectTrigger className="h-8 w-full text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INCOME">Receita</SelectItem>
                            <SelectItem value="EXPENSE">Despesa</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span
                          className={`inline-flex h-8 items-center text-sm font-medium ${
                            t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {t.type === 'INCOME' ? 'Receita' : 'Despesa'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 align-middle min-w-0">
                      {isEditing ? (
                        <Input
                          value={draft.description}
                          onChange={(e) => updateDraftField(t.id, t, 'description', e.target.value)}
                          className="h-8 w-full text-sm"
                        />
                      ) : (
                        <div className="flex h-8 items-center gap-2 text-sm font-medium truncate">
                          <span className="truncate">{t.description}</span>
                          {Number(t.installments) > 1 && (
                            <span className="shrink-0 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {t.installments}x
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-2 align-middle min-w-0">
                      {isEditing ? (
                        <Input
                          value={draft.category}
                          onChange={(e) => updateDraftField(t.id, t, 'category', e.target.value)}
                          className="h-8 w-full text-sm"
                        />
                      ) : (
                        <span className="flex h-8 items-center text-sm truncate">{t.category}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 align-middle min-w-0">
                      {isEditing ? (
                        <Input
                          value={draft.responsible}
                          onChange={(e) => updateDraftField(t.id, t, 'responsible', e.target.value)}
                          className="h-8 w-full text-sm"
                          placeholder="—"
                        />
                      ) : (
                        <span className="flex h-8 items-center text-sm truncate">
                          {t.responsible || '—'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-1 align-middle text-center">
                      {isEditing ? (
                        draft.type !== 'EXPENSE' ? (
                          <span className="inline-flex h-8 items-center justify-center text-muted-foreground text-sm">
                            —
                          </span>
                        ) : parcelada ? (
                          <div className="flex h-8 items-center justify-center gap-0.5">
                            <Input
                              type="number"
                              min={0}
                              max={installmentTotal(draft)}
                              title="Parcelas já pagas"
                              value={draft.installmentsPaid}
                              onChange={(e) =>
                                updateDraftField(t.id, t, 'installmentsPaid', e.target.value)
                              }
                              className="h-8 w-9 p-0 text-center text-xs tabular-nums"
                            />
                            <span className="text-muted-foreground text-xs leading-none">/</span>
                            <Input
                              type="number"
                              min={2}
                              title="Total de parcelas"
                              value={draft.installments}
                              onChange={(e) =>
                                updateDraftField(t.id, t, 'installments', e.target.value)
                              }
                              className="h-8 w-9 p-0 text-center text-xs tabular-nums"
                            />
                          </div>
                        ) : (
                          <div
                            className="flex h-8 items-center justify-center gap-1.5"
                            title="À vista (1x). Aumente para 2+ para parcelamento."
                          >
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              À vista
                            </span>
                            <Input
                              type="number"
                              min={1}
                              value={draft.installments}
                              onChange={(e) =>
                                updateDraftField(t.id, t, 'installments', e.target.value)
                              }
                              className="h-8 w-10 p-0 text-center text-xs tabular-nums"
                            />
                          </div>
                        )
                      ) : t.type !== 'EXPENSE' ? (
                        <span className="inline-flex h-8 items-center justify-center text-muted-foreground text-sm">
                          —
                        </span>
                      ) : totalTx > 1 ? (
                        <span className="inline-flex h-8 items-center justify-center text-sm tabular-nums">
                          {paidTx}/{totalTx}
                        </span>
                      ) : (
                        <span className="inline-flex h-8 items-center justify-center text-xs text-muted-foreground">
                          À vista
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 align-middle">
                      {isEditing ? (
                        <div className="flex h-8 items-center justify-end">
                          <Input
                            type="number"
                            step="0.01"
                            value={draft.amount}
                            onChange={(e) => updateDraftField(t.id, t, 'amount', e.target.value)}
                            className={`h-8 w-full max-w-[96px] text-right text-sm font-semibold tabular-nums ${
                              draft.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="flex h-8 items-center justify-end">
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {t.type === 'INCOME' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-1 align-middle text-right">
                      <div className="flex h-8 items-center justify-end gap-0.5">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              disabled={isSaving}
                              onClick={() => handleSaveRow(t)}
                              title="Salvar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              disabled={isSaving}
                              onClick={cancelEdit}
                              title="Cancelar edição"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <TransactionActions transaction={t} />
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              onClick={() => beginEdit(t)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <TransactionActions transaction={t} />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
