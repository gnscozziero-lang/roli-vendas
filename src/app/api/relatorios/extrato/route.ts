import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const due_date = searchParams.get('due_date')

  if (!due_date) {
    return NextResponse.json({ error: 'Parâmetro due_date obrigatório.' }, { status: 400 })
  }

  try {
    // Busca o vencimento anterior (o maior due_date menor que o atual)
    const prevResult = await sql`
      SELECT MAX(due_date) as prev_due
      FROM orders
      WHERE due_date < ${due_date}
    `
    const prevDue = (prevResult as any[])[0]?.prev_due
    const prevDueStr = prevDue
      ? (typeof prevDue === 'string' ? prevDue.substring(0, 10) : prevDue.toISOString().substring(0, 10))
      : '2000-01-01'

    // Pedidos do ciclo (com esse due_date)
    const orders = await sql`
      SELECT id, order_date, due_date, total_amount, description
      FROM orders
      WHERE due_date = ${due_date}
      ORDER BY order_date ASC
    `

    // Pagamentos entre o vencimento anterior (exclusive) e este vencimento (inclusive)
    const payments = await sql`
      SELECT id, payment_date, amount, notes
      FROM payments
      WHERE payment_date > ${prevDueStr}
        AND payment_date <= ${due_date}
      ORDER BY payment_date ASC
    `

    return NextResponse.json({ orders, payments, prevDue: prevDueStr })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
