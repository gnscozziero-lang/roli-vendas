import { sql } from '@/lib/db'
import { formatDateISO } from '@/lib/billing'
import PrintButton from './PrintButton'
import { getActiveClients } from '@/lib/actions'
import DashboardClient from './DashboardClient'

function toISO(val: any): string {
  if (!val) return ''
  if (val instanceof Date) return formatDateISO(val)
  return String(val).substring(0, 10)
}

export default async function DashboardPage() {
  const clients = await getActiveClients() as any[]

  const orderRows = await sql`SELECT * FROM orders ORDER BY due_date ASC, id ASC` as any[]
  const orders = orderRows.map((r: any) => ({
    ...r,
    order_date: toISO(r.order_date),
    due_date: toISO(r.due_date),
    total_amount: Number(r.total_amount),
  }))

  const paymentRows = await sql`SELECT * FROM payments ORDER BY payment_date ASC, id ASC` as any[]
  const payments = paymentRows.map((r: any) => ({
    ...r,
    amount: Number(r.amount),
    payment_date: toISO(r.payment_date),
    due_date_ref: r.due_date_ref ? toISO(r.due_date_ref) : null,
  }))

  // Fetch all initial_balance settings (global + per client)
  const settingRows = await sql`SELECT key, value FROM settings WHERE key LIKE 'initial_balance%'` as any[]
  const balanceMap: Record<string, number> = {}
  for (const row of settingRows) {
    balanceMap[row.key] = Number(row.value)
  }

  const recentOrderRows = await sql`SELECT * FROM orders ORDER BY order_date DESC, id DESC LIMIT 20` as any[]
  const recentOrders = recentOrderRows.map((r: any) => ({
    ...r,
    order_date: toISO(r.order_date),
    due_date: toISO(r.due_date),
    total_amount: Number(r.total_amount),
  }))

  const recentPaymentRows = await sql`SELECT * FROM payments ORDER BY payment_date DESC, id DESC LIMIT 20` as any[]
  const recentPayments = recentPaymentRows.map((r: any) => ({
    ...r,
    amount: Number(r.amount),
    payment_date: toISO(r.payment_date),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Resumo financeiro</p>
        </div>
        <PrintButton />
      </div>
      <DashboardClient
        orders={orders}
        payments={payments}
        clients={clients}
        balanceMap={balanceMap}
        recentOrders={recentOrders}
        recentPayments={recentPayments}
      />
      <div className="hidden print:block text-right text-xs text-gray-400 mt-8">
        Emitido em {new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  )
}
