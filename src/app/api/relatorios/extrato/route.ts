import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { calculateBalances, formatDateISO } from '@/lib/billing'

function toISO(val: any): string {
  if (!val) return ''
  if (val instanceof Date) return formatDateISO(val)
  return String(val).substring(0, 10)
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

  // Use calculateBalances to get correct overdue/upcoming/total
  const initialBalance = 0 // extrato uses raw balances; dashboard handles initial_balance separately
  const { cycles, total_open, overdue_amount, next_due_amount } =
    calculateBalances(allOrders as any, allPayments as any, initialBalance)

  // Determine target cycle
  const targetDue = due_date || cycles[0]?.due_date

  // Orders for this specific cycle only
  const cycleOrders = targetDue
    ? allOrders.filter(o => o.due_date === targetDue)
    : []

  // Payments: ONLY those explicitly linked to this cycle via due_date_ref
  // Do NOT use date-range fallback — it brings in all historical payments
  const cyclePayments = targetDue
    ? allPayments.filter(p => p.due_date_ref === targetDue)
    : []

  const cycle = targetDue ? (cycles as any[]).find(c => c.due_date === targetDue) : null

  return NextResponse.json({
    due_date: targetDue,
    overdue: overdue_amount,
    upcoming: cycle?.remaining ?? 0,
    total_open,
    orders: cycleOrders,
    payments: cyclePayments,
    cycles,
  })
}
