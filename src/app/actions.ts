'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TransactionType } from '@prisma/client'

function normalizeTransactionType(rawType: string): TransactionType | null {
  if (rawType === 'INCOME' || rawType === 'Receita') return 'INCOME'
  if (rawType === 'EXPENSE' || rawType === 'Despesa') return 'EXPENSE'
  return null
}

function clampInstallmentsPaid(total: number, paid: number) {
  if (total < 1) return 0
  return Math.min(Math.max(0, paid), total)
}

function asActionError(err: unknown): Error {
  if (err instanceof Error) return err
  return new Error(typeof err === 'string' ? err : 'Erro inesperado no servidor.')
}

export async function addTransaction(formData: FormData) {
  try {
    const description = formData.get('description') as string
    const responsible = formData.get('responsible') as string
    const amount = parseFloat(formData.get('amount') as string)
    const rawType = formData.get('type') as string
    const type = normalizeTransactionType(rawType)
    const category = formData.get('category') as string
    const installments = Math.max(1, parseInt(formData.get('installments') as string) || 1)
    const installmentsPaidRaw = parseInt(formData.get('installmentsPaid') as string)
    const installmentsPaid = Number.isFinite(installmentsPaidRaw)
      ? clampInstallmentsPaid(installments, installmentsPaidRaw)
      : 0
    const dateStr = formData.get('date') as string
    const date = dateStr ? new Date(dateStr) : new Date()

    if (!description || !responsible || isNaN(amount) || !type || !category) {
      throw new Error('Dados inválidos: preencha descrição, responsável, valor e categoria.')
    }

    await prisma.transaction.create({
      data: {
        description,
        responsible,
        amount,
        type,
        category,
        installments,
        installmentsPaid: type === 'EXPENSE' ? installmentsPaid : 0,
        date,
      },
    })

    revalidatePath('/')
    return { ok: true as const }
  } catch (err) {
    console.error('[addTransaction]', err)
    throw asActionError(err)
  }
}

export async function updateTransaction(id: string, formData: FormData) {
  try {
    const description = formData.get('description') as string
    const responsible = formData.get('responsible') as string
    const amount = parseFloat(formData.get('amount') as string)
    const rawType = formData.get('type') as string
    const type = normalizeTransactionType(rawType)
    const category = formData.get('category') as string
    const installments = Math.max(1, parseInt(formData.get('installments') as string) || 1)
    const installmentsPaidRaw = parseInt(formData.get('installmentsPaid') as string)
    const installmentsPaid = Number.isFinite(installmentsPaidRaw)
      ? clampInstallmentsPaid(installments, installmentsPaidRaw)
      : 0
    const dateStr = formData.get('date') as string
    const date = dateStr ? new Date(dateStr) : new Date()

    if (!description || !responsible || isNaN(amount) || !type || !category) {
      throw new Error('Dados inválidos: preencha descrição, responsável, valor e categoria.')
    }

    await prisma.transaction.update({
      where: { id },
      data: {
        description,
        responsible,
        amount,
        type,
        category,
        installments,
        installmentsPaid: type === 'EXPENSE' ? installmentsPaid : 0,
        date,
      },
    })

    revalidatePath('/')
    return { ok: true as const }
  } catch (err) {
    console.error('[updateTransaction]', err)
    throw asActionError(err)
  }
}

export async function deleteTransaction(id: string) {
  try {
    await prisma.transaction.delete({
      where: { id },
    })
    revalidatePath('/')
    return { ok: true as const }
  } catch (err) {
    console.error('[deleteTransaction]', err)
    throw asActionError(err)
  }
}

export async function deleteMultipleTransactions(ids: string[]) {
  try {
    await prisma.transaction.deleteMany({
      where: {
        id: { in: ids },
      },
    })
    revalidatePath('/')
    return { ok: true as const }
  } catch (err) {
    console.error('[deleteMultipleTransactions]', err)
    throw asActionError(err)
  }
}
