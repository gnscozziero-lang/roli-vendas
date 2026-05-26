import { sql } from '@/lib/db'
import { formatDateISO } from '@/lib/billing'
import NovoPagamentoForm from './NovoPagamentoForm'
import PagamentosTable from './PagamentosTable'
import { getActiveClients } from '@/lib/actions'

function toISO(val: any): string {
  if (!val) return ''
  if (val instanceof Date) return formatDateISO(val)
  return String(val).substring(0, 10)
}

export default async function PagamentosPage() {
  const paymentRows = await sql`SELECT * FROM payments ORDER BY payment_date DESC, id DESC` as any[]
  const payments = paymentRows.map((r: any) => ({
    ...r, amount: Number(r.amount),
    payment_date: toISO(r.payment_date),
    due_date_ref: r.due_date_ref ? toISO(r.due_date_ref) : null,
  }))

  const clients = await getActiveClients() as any[]
  const dueDateRows = await sql`SELECT DISTINCT due_date FROM orders ORDER BY due_date DESC` as any[]
  const dueDateOptions = dueDateRows.map((r: any) => toISO(r.due_date))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-sm text-gray-500 mt-1">Registre recebimentos e acompanhe o histórico</p>
      </div>
      <div className="card p-6">
        <NovoPagamentoForm clients={clients} dueDateOptions={dueDateOptions} />
      </div>
      <div className="card overflow-hidden">
        <PagamentosTable payments={payments} clients={clients} />
      </div>
    </div>
  )
}
