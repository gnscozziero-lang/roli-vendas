import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function round2(n: number) { return Math.round(n * 100) / 100 }

function toISO(val: unknown): string {
  if (!val) return ''
  if (val instanceof Date) return val.toISOString().substring(0, 10)
  return String(val).substring(0, 10)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const due_date = searchParams.get('due_date')
  if (!due_date) return NextResponse.json({ error: 'due_date obrigatório.' }, { status: 400 })

  try {
    const today = new Date().toISOString().substring(0, 10)

    // Busca o saldo inicial (carry-forward)
    const settingsRows = await sql`SELECT value FROM settings WHERE key = 'initial_balance'`
    const initialBalance = Number((settingsRows as any[])[0]?.value ?? 0)

    // Todos os pedidos anteriores ao ciclo selecionado, agrupados por due_date
    const prevOrders = await sql`
      SELECT due_date, SUM(total_amount) as total
      FROM orders WHERE due_date < ${due_date}
      GROUP BY due_date ORDER BY due_date ASC
    `

    // Todos os pagamentos (sem filtro de ciclo — mesma lógica do dashboard)
    // Para ciclos anteriores, usamos TODOS os pagamentos que não são deste ciclo
    const prevPayments = await sql`
      SELECT amount FROM payments
      WHERE due_date_ref < ${due_date}
         OR (due_date_ref IS NULL AND payment_date < ${due_date})
    `

    // Replica calculateBalances para ciclos anteriores
    // Monta mapa de ciclos
    const cycleMap = new Map<string, number>()
    if (initialBalance > 0) cycleMap.set('2022-12-30', initialBalance)
    for (const o of prevOrders as any[]) {
      const d = toISO(o.due_date)
      cycleMap.set(d, (cycleMap.get(d) ?? 0) + Number(o.total))
    }

    // Ordena ciclos do mais antigo ao mais novo
    const cycles = Array.from(cycleMap.entries())
      .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([due, total]) => ({ due_date: due, total, remaining: total }))

    // Aplica pagamentos nos ciclos mais antigos primeiro
    let remainingPay = (prevPayments as any[]).reduce((s: number, p: any) => s + Number(p.amount), 0)
    for (const c of cycles) {
      if (remainingPay <= 0) break
      const covered = Math.min(remainingPay, c.remaining)
      c.remaining  = round2(c.remaining - covered)
      remainingPay = round2(remainingPay - covered)
    }

    // Separa saldo anterior em atrasado e a vencer (baseado em today)
    let saldoAtrasado = 0
    let saldoAVencer  = 0
    for (const c of cycles) {
      if (c.remaining <= 0) continue
      if (c.due_date < today) saldoAtrasado += c.remaining
      else saldoAVencer += c.remaining
    }

    // Vencimento anterior para label
    const prevResult = await sql`SELECT MAX(due_date) as prev_due FROM orders WHERE due_date < ${due_date}`
    const prevDue = (prevResult as any[])[0]?.prev_due
    const prevDueStr = prevDue ? toISO(prevDue) : '2000-01-01'

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
      saldoAtrasado: round2(saldoAtrasado),
      saldoAVencer:  round2(saldoAVencer),
      today,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
