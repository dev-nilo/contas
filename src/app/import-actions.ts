'use server'

import PDFParser from 'pdf2json'

export async function parseStatementPdf(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const text = await new Promise<string>((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(null, 1)
    
    pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError))
    pdfParser.on('pdfParser_dataReady', () => {
      resolve((pdfParser as any).getRawTextContent())
    })
    
    pdfParser.parseBuffer(buffer)
  })

  console.log('--- EXTRATO PDF TEXTO EXTRAÍDO ---')
  console.log(text)
  console.log('----------------------------------')

  const lines = text.split('\n').filter((l: string) => l.trim().length > 0)
  console.log(`Linhas encontradas: ${lines.length}`)
  const transactions: any[] = []

  // Enhanced Regex:
  // Date: DD/MM or DD/MM/YYYY or DD MMM (ex: 25 ABR)
  const dateRegex = /(\d{2}\/\d{2}(?:\/\d{4})?|\d{2}\s(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ))/i
  // Amount: Matches values like 1.234,56 or 1234,56 or R$ 123,45 with optional negative sign
  const amountRegex = /(-?\s?(?:R\$\s?)?(\d{1,3}(?:\.\d{3})*|\d+)[\.,]\d{2})/

  for (const line of lines) {
    const dateMatch = line.match(dateRegex)
    const amountMatch = line.match(amountRegex)

    if (dateMatch && amountMatch) {
      console.log(`Linha compatível encontrada: ${line}`)
      
      let description = line
        .replace(dateMatch[0], '')
        .replace(amountMatch[0], '')
        .replace(/R\$/, '')
        .trim()

      if (description.length < 3) description = "Transação Importada"

      // Parse amount
      let amountStr = amountMatch[0]
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
      
      let amount = parseFloat(amountStr)
      
      // Logic for type: 
      // Default to Despesa as per user request. 
      // Treat as Receita only if it's explicitly positive or has keywords.
      let type: 'INCOME' | 'EXPENSE' = 'EXPENSE'
      
      const ReceitaKeywords = ['SALARIO', 'PIX RECEBIDO', 'RENDIMENTO', 'TRANSFERENCIA RECEBIDA', 'DEPOSITO', 'CREDITO']
      const isExplicitlyNegative = amountMatch[0].includes('-')
      const hasReceitaKeyword = ReceitaKeywords.some(kw => line.toUpperCase().includes(kw))

      if (hasReceitaKeyword && !isExplicitlyNegative) {
        type = 'INCOME'
      }

      amount = Math.abs(amount)

      // Parse date
      let date = new Date()
      const dateStr = dateMatch[0].toUpperCase()
      
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/')
        date.setDate(parseInt(parts[0]))
        date.setMonth(parseInt(parts[1]) - 1)
        if (parts[2]) date.setFullYear(parseInt(parts[2]))
      } else {
        const monthsMap: any = { 'JAN': 0, 'FEV': 1, 'MAR': 2, 'ABR': 3, 'MAI': 4, 'JUN': 5, 'JUL': 6, 'AGO': 7, 'SET': 8, 'OUT': 9, 'NOV': 10, 'DEZ': 11 }
        const parts = dateStr.split(' ')
        date.setDate(parseInt(parts[0]))
        date.setMonth(monthsMap[parts[1]])
      }

      transactions.push({
        description,
        amount,
        type,
        date: date.toISOString().split('T')[0],
      })
    }
  }

  return transactions
}
