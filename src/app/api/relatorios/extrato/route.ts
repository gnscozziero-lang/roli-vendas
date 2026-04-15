import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const due_date = searchParams.get('due_date')

  if (!due_date) {
    return NextResponse.json({ error: 'Parâmetro due_date obrigatório.' }, { status: 400 })
  }

  try {
    // Vencimento anterior para label
    const prevResult = await sql`
      SELECT MAX(due_date) as prev_due FROM orders WHERE due_date < ${due_date}
    `
    const prevDue = (prevResult as any[])[0]?.prev_due
    const prevDueStr = prevDue
      ? (typeof prevDue === 'string' ? prevDue.substring(0, 10) : prevDue.toISOString().substring(0, 10))
      : '2000-01-01'

    // Todos os pedidos de ciclos ANTERIORES ao selecionado
    const allPrevOrders = await sql`
      SELECT total_amount FROM orders WHERE due_date < ${due_date}
    `
    // Todos os pagamentos referentes a ciclos ANTERIORES ao selecionado
    const allPrevPayments = await sql`
      SELECT amount FROM payments
      WHERE due_date_ref < ${due_date}
         OR (due_date_ref IS NULL AND payment_date <= ${prevDueStr})
    `

    // Saldo anterior = soma pedidos anteriores - soma pagamentos anteriores
    const totalPrevOrders   = (allPrevOrders as any[]).reduce((s: number, o: any) => s + Number(o.total_amount), 0)
    const totalPrevPayments = (allPrevPayments as any[]).reduce((s: number, p: any) => s + Number(p.amount), 0)
    const saldoAnterior = Math.max(0, totalPrevOrders - totalPrevPayments)

    // Pedidos do ciclo selecionado
    const orders = await sql`
      SELECT id, order_date, due_date, total_amount, description
      FROM orders WHERE due_date = ${due_date}
      ORDER BY order_date ASC
    `

    // Pagamentos referentes a este vencimento
    const payments = await sql`
      SELECT id, payment_date, amount, notes, due_date_ref
      FROM payments
      WHERE due_date_ref = ${due_date}
         OR (due_date_ref IS NULL AND payment_date > ${prevDueStr} AND payment_date <= ${due_date})
      ORDER BY payment_date ASC
    `

    return NextResponse.json({
      orders,
      payments,
      prevDue: prevDueStr,
      saldoAnterior,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
