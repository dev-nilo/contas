import prisma from '@/lib/prisma'
import { AddTransactionDialog } from '@/components/add-transaction-dialog'
import { DateFilter } from '@/components/date-filter'
import { PdfUpload } from '@/components/pdf-upload'
import { TransactionTable } from '@/components/transaction-table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string
    year?: string
    description?: string
    category?: string
    orderBy?: 'date' | 'description' | 'category' | 'responsible' | 'amount'
    order?: 'asc' | 'desc'
  }>
}) {
  const { month, year, description, category, orderBy, order } = await searchParams
  
  const selectedMonthValue = month ? parseInt(month) : new Date().getMonth() + 1
  const selectedMonth = selectedMonthValue - 1 // Back to 0-indexed for JS Date
  const selectedYear = year ? parseInt(year) : new Date().getFullYear()

  // Define the date range for the selected month
  const startOfMonth = new Date(selectedYear, selectedMonth, 1)
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59)

  const sortField = ['date', 'description', 'category', 'responsible', 'amount'].includes(orderBy || '')
    ? (orderBy as 'date' | 'description' | 'category' | 'responsible' | 'amount')
    : 'date'
  const sortOrder = order === 'asc' ? 'asc' : 'desc'

  // Fetch all transactions to filter them in memory for "Assinaturas" logic
  const allTransactions = await prisma.transaction.findMany({
    orderBy: { [sortField]: sortOrder },
  })

  const transactions = allTransactions.filter((t: any) => {
    const tDate = new Date(t.date)

    const matchesDescription = !description || t.description.toLowerCase().includes(description.toLowerCase())
    const matchesCategory = !category || t.category === category
    
    // Rule for Fixed Subscriptions: 
    // If it's a subscription, show it if the start date is before or within the selected month
    if (t.category === 'Assinaturas') {
      return tDate <= endOfMonth && matchesDescription && matchesCategory
    }

    // Normal Rule: Only show if it's within the selected month and year
    const isInSelectedMonth = (
      tDate.getMonth() === selectedMonth && 
      tDate.getFullYear() === selectedYear
    )

    if (!isInSelectedMonth) return false
    if (!matchesDescription) return false
    if (!matchesCategory) return false

    return true
  })

  const totals = transactions.reduce(
    (acc: { Receita: number; Despesas: number }, transaction: any) => {
      if (transaction.type === 'INCOME') {
        acc.Receita += transaction.amount
      } else {
        acc.Despesas += transaction.amount
      }
      return acc
    },
    { Receita: 0, Despesas: 0 }
  )

  const balance = totals.Receita - totals.Despesas

  return (
    <main className="container mx-auto py-10 px-4 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finanças da Família</h1>
          <p className="text-muted-foreground">Gerencie seus gastos e receitas mensais</p>
        </div>
        <div className="flex items-center gap-2">
          <DateFilter />
          <div className="flex gap-2 ml-4">
            <PdfUpload />
            <div className="h-8 w-px bg-border mx-2" />
            <AddTransactionDialog defaultType="Receita" />
            <AddTransactionDialog defaultType="Despesa" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totals.Receita.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {totals.Despesas.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <TransactionTable 
            transactions={transactions} 
            monthName={startOfMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })} 
          />
        </CardContent>
      </Card>
    </main>
  )
}
