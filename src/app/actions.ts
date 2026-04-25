'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TransactionType } from '@prisma/client'

export async function addTransaction(formData: FormData) {
  const description = formData.get('description') as string
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as TransactionType
  const category = formData.get('category') as string
  const installments = parseInt(formData.get('installments') as string) || 1
  const dateStr = formData.get('date') as string
  const date = dateStr ? new Date(dateStr) : new Date()

  if (!description || isNaN(amount) || !type || !category) {
    throw new Error('Invalid input')
  }

  await prisma.transaction.create({
    data: {
      description,
      amount,
      type,
      category,
      installments,
      date,
    },
  })

  revalidatePath('/')
}

export async function updateTransaction(id: string, formData: FormData) {
  const description = formData.get('description') as string
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as TransactionType
  const category = formData.get('category') as string
  const installments = parseInt(formData.get('installments') as string) || 1
  const dateStr = formData.get('date') as string
  const date = dateStr ? new Date(dateStr) : new Date()

  if (!description || isNaN(amount) || !type || !category) {
    throw new Error('Invalid input')
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      description,
      amount,
      type,
      category,
      installments,
      date,
    },
  })

  revalidatePath('/')
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({
    where: { id },
  })
  revalidatePath('/')
}
