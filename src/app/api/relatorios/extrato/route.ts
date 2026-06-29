import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { calculateBalances, formatDateISO } from '@/lib/billing'

function toISO(val: any): string {
  if (!val) return ''
  if (val instanceof Date) return formatDateISO(val)
  return String(val).substring(0, 10)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const due_date = searchParams.get('due_date')
  const client = searchParams.get('client')

  let allOrderRows: any[]
  let allPaymentRows: any[]

  if (client) {
    allOrderRows = await sql`SELECT * FROM orders WHERE client = ${client} ORDER BY due_date ASC, id ASC` as any[]
    allPaymentRows = await sql`SELECT * FROM payments WHERE client = ${client} ORDER BY payment_date ASC, id ASC` as any[]
  } else {
    allOrderRows = await sql`SELECT * FROM orders ORDER BY due_date ASC, id ASC` as any[]
    allPaymentRows = await sql`SELECT * FROM payments ORDER BY payment_date ASC, id ASC` as any[]
  }

  const allOrders = allOrderRows.map((r: any) => ({
    ...r,
    order_date: toISO(r.order_date),
    due_date: toISO(r.due_date),
    total_amount: Number(r.total_amount),
  }))

  const allPayments = allPaymentRows.map((r: any) => ({
    ...r,
    amount: Number(r.amount),
    payment_date: toISO(r.payment_date),
    due_date_ref: r.due_date_ref ? toISO(r.due_date_ref) : null,
  }))

  // Modelo isolado por ciclo: cada vencimento é abatido apenas pelos pagamentos vinculados
  // a ele (due_date_ref); sobra ou pagamento órfão rola para o próximo ciclo aberto.
  const initialBalance = 0 // extrato usa saldos brutos; dashboard trata initial_balance separadamente
  const { all_cycles, total_open, customer_advance } =
    calculateBalances(allOrders as any, allPayments as any, initialBalance)

  // Data de referência do relatório: a selecionada pelo usuário, ou o primeiro ciclo aberto
  const targetDue: string | null =
    due_date || all_cycles.find(c => c.remaining > 0)?.due_date || all_cycles[0]?.due_date || null

  // Classificação relativa à DATA SELECIONADA no relatório (não à data de hoje):
  //  - Em atraso:  ciclos anteriores à selecionada, com saldo > 0
  //  - Selecionado: o ciclo exatamente na data selecionada (mostrado mesmo com saldo 0)
  //  - Próximos:   ciclos posteriores à selecionada, com saldo > 0
  const overdueCycles = targetDue
    ? all_cycles.filter(c => c.due_date < targetDue && c.remaining > 0)
    : []
  const upcomingCycles = targetDue
    ? all_cycles.filter(c => c.due_date > targetDue && c.remaining > 0)
    : []
  const selectedCycle = targetDue
    ? all_cycles.find(c => c.due_date === targetDue) ??
      { due_date: targetDue, total_orders: 0, remaining: 0, is_overdue: false, is_next_due: false }
    : null

  const overdue_total = round2(overdueCycles.reduce((s, c) => s + c.remaining, 0))
  const upcoming_total = round2(upcomingCycles.reduce((s, c) => s + c.remaining, 0))

  // Pedidos e pagamentos detalhados do ciclo selecionado
  const cycleOrders = targetDue ? allOrders.filter(o => o.due_date === targetDue) : []
  const cyclePayments = targetDue ? allPayments.filter(p => p.due_date_ref === targetDue) : []

  return NextResponse.json({
    due_date: targetDue,
    overdue_cycles: overdueCycles,
    overdue_total,
    selected_cycle: selectedCycle,
    upcoming_cycles: upcomingCycles,
    upcoming_total,
    customer_advance,
    total_open,
    orders: cycleOrders,
    payments: cyclePayments,
    cycles: all_cycles,
  })
}
