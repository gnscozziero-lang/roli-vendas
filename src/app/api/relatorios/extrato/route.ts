import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const due_date = searchParams.get('due_date')

  if (!due_date) {
    return NextResponse.json({ error: 'Parâmetro due_date obrigatório.' }, { status: 400 })
  }

  try {
    // Vencimento anterior para label do relatório
    const prevResult = await sql`
      SELECT MAX(due_date) as prev_due FROM orders WHERE due_date < ${due_date}
    `
    const prevDue = (prevResult as any[])[0]?.prev_due
    const prevDueStr = prevDue
      ? (typeof prevDue === 'string' ? prevDue.substring(0, 10) : prevDue.toISOString().substring(0, 10))
      : '2000-01-01'

    // Pedidos do ciclo
    const orders = await sql`
      SELECT id, order_date, due_date, total_amount, description
      FROM orders WHERE due_date = ${due_date}
      ORDER BY order_date ASC
    `

    // Pagamentos referentes a este vencimento (usando due_date_ref)
    // Fallback: se due_date_ref for nulo, usa a lógica antiga de período
    const payments = await sql`
      SELECT id, payment_date, amount, notes, due_date_ref
      FROM payments
      WHERE due_date_ref = ${due_date}
         OR (due_date_ref IS NULL AND payment_date > ${prevDueStr} AND payment_date <= ${due_date})
      ORDER BY payment_date ASC
    `

    return NextResponse.json({ orders, payments, prevDue: prevDueStr })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
