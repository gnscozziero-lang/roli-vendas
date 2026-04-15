import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const due_date = searchParams.get('due_date')
  if (!due_date) return NextResponse.json({ error: 'due_date obrigatório.' }, { status: 400 })

  try {
    const today = new Date().toISOString().substring(0, 10)

    // Vencimento anterior para label
    const prevResult = await sql`SELECT MAX(due_date) as prev_due FROM orders WHERE due_date < ${due_date}`
    const prevDue = (prevResult as any[])[0]?.prev_due
    const prevDueStr = prevDue
      ? (typeof prevDue === 'string' ? prevDue.substring(0, 10) : prevDue.toISOString().substring(0, 10))
      : '2000-01-01'

    // Todos os ciclos anteriores ao selecionado com seus saldos
    const prevCiclos = await sql`
      SELECT due_date, SUM(total_amount) as total_pedidos
      FROM orders
      WHERE due_date < ${due_date}
      GROUP BY due_date
      ORDER BY due_date ASC
    `

    // Todos os pagamentos anteriores ao ciclo selecionado
    const prevPayments = await sql`
      SELECT amount, due_date_ref, payment_date
      FROM payments
      WHERE due_date_ref < ${due_date}
         OR (due_date_ref IS NULL AND payment_date <= ${prevDueStr})
    `

    // Calcular saldo de cada ciclo anterior aplicando pagamentos do mais antigo ao mais novo
    let remainingPayments = (prevPayments as any[]).reduce((s: number, p: any) => s + Number(p.amount), 0)
    let saldoAtrasado = 0
    let saldoAVencer = 0

    for (const ciclo of prevCiclos as any[]) {
      const dueDateStr = typeof ciclo.due_date === 'string'
        ? ciclo.due_date.substring(0, 10)
        : ciclo.due_date.toISOString().substring(0, 10)
      const totalCiclo = Number(ciclo.total_pedidos)
      const coberto = Math.min(remainingPayments, totalCiclo)
      const saldoCiclo = Math.max(0, totalCiclo - coberto)
      remainingPayments = Math.max(0, remainingPayments - coberto)

      if (saldoCiclo > 0) {
        if (dueDateStr < today) {
          saldoAtrasado += saldoCiclo
        } else {
          saldoAVencer += saldoCiclo
        }
      }
    }

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
      saldoAtrasado: Math.round(saldoAtrasado * 100) / 100,
      saldoAVencer:  Math.round(saldoAVencer  * 100) / 100,
      today,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
