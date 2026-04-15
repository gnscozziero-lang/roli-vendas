import { sql } from '@/lib/db'
import { formatCurrency, formatDateBR, calculateBalances } from '@/lib/billing'
import NovoPagamentoForm from './NovoPagamentoForm'
import PagamentosTable from './PagamentosTable'

export const revalidate = 0

export default async function PagamentosPage() {
  const [payments, orders, settings, ciclos] = await Promise.all([
    sql`SELECT id, payment_date, amount, notes, imported, due_date_ref FROM payments ORDER BY payment_date DESC`,
    sql`SELECT due_date, total_amount FROM orders`,
    sql`SELECT key, value FROM settings`,
    sql`SELECT DISTINCT due_date FROM orders ORDER BY due_date DESC`,
  ])

  const initialBalance = Number((settings as any[]).find((s: any) => s.key === 'initial_balance')?.value ?? 0)
  const summary = calculateBalances(orders as any[], payments as any[], initialBalance)

  const toISO = (v: unknown) => !v ? '' : v instanceof Date ? v.toISOString().substring(0, 10) : String(v).substring(0, 10)

  const ciclosList = (ciclos as any[]).map((c: any) => ({ due_date: toISO(c.due_date) }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-sm text-gray-500 mt-1">Registre pagamentos recebidos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Saldo Total em Aberto</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(summary.total_open)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Próximo Vencimento</p>
          {summary.next_due_date ? (
            <>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.next_due_amount)}</p>
              <p className="text-xs text-gray-400 mt-0.5">até {formatDateBR(summary.next_due_date)}</p>
            </>
          ) : (
            <p className="text-lg text-green-700 font-semibold mt-1">Sem vencimentos</p>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-5">Registrar Pagamento</h2>
        <NovoPagamentoForm
          totalOpen={summary.total_open}
          nextDueAmount={summary.next_due_amount}
          nextDueDate={summary.next_due_date}
          ciclos={ciclosList}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Histórico de Pagamentos
            <span className="ml-2 text-sm font-normal text-gray-400">({payments.length} registros)</span>
          </h2>
        </div>
        <PagamentosTable
          payments={(payments as any[]).map((p: any) => ({
            ...p,
            payment_date: toISO(p.payment_date),
            due_date_ref: toISO(p.due_date_ref),
          }))}
          ciclos={ciclosList}
        />
      </div>
    </div>
  )
}
