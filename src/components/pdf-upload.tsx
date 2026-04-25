'use client'

import { useState } from 'react'
import { FileUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { parseStatementPdf } from '@/app/import-actions'
import { addTransaction } from '@/app/actions'

export function PdfUpload() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await parseStatementPdf(formData)
      setTransactions(result)
    } catch (error) {
      console.error(error)
      alert('Erro ao processar PDF. Verifique o formato.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setLoading(true)
    try {
      for (const t of transactions) {
        const formData = new FormData()
        formData.append('description', t.description)
        formData.append('amount', t.amount.toString())
        formData.append('type', t.type)
        formData.append('category', 'Outros')
        formData.append('date', t.date)
        await addTransaction(formData)
      }
      setOpen(false)
      setTransactions([])
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar transações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <FileUp className="h-4 w-4" />
            Importar Extrato (PDF)
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Transações de PDF</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pdf-file">Selecione o arquivo PDF do seu banco</Label>
            <Input id="pdf-file" type="file" accept="application/pdf" onChange={handleUpload} disabled={loading} />
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processando arquivo...</p>
            </div>
          )}

          {!loading && transactions.length > 0 && (
            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Data</th>
                      <th className="px-4 py-2 text-left">Descrição</th>
                      <th className="px-4 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-2 truncate max-w-[200px]">{t.description}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => {
                              const newTransactions = [...transactions]
                              newTransactions[i].type = t.type === 'INCOME' ? 'EXPENSE' : 'INCOME'
                              setTransactions(newTransactions)
                            }}
                            className={`font-medium px-2 py-1 rounded-md transition-colors ${
                              t.type === 'INCOME' 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground">Foram encontradas {transactions.length} transações.</p>
              <Button onClick={handleSave} className="w-full">Confirmar e Importar Tudo</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label>
}
