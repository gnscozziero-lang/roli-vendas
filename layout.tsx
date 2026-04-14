import { sql } from '@/lib/db'
import { formatCurrency, formatDateBR, calculateBalances } from '@/lib/billing'
import NovoPagamentoForm from './NovoPagamentoForm'
import DeletePgtoButton from './DeletePgtoButton'
import type { Payment } from '@/types'

export const revalidate = 0

export default async function PagamentosPage() {
  const [payments, orders, settings] = await Promise.all([
    sql<Payment[]>`SELECT id, payment_date, amount, notes, imported FROM payments ORDER BY payment_date DESC`,
    sql<{ due_date: string; total_amount: number }[]>`SELECT due_date, total_amount FROM orders`,
    sql<{ key: string; value: string }[]>`SELECT key, value FROM settings`,
  ])

  const initialBalance = Number(settings.find(s => s.key === 'initial_balance')?.value ?? 0)
  const summary = calculateBalances(orders, payments, initialBalance)

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
        />
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Histórico de Pagamentos
            <span className="ml-2 text-sm font-normal text-gray-400">({payments.length} registros)</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Observação</th>
                <th className="px-6 py-3 font-medium text-right">Valor</th>
                <th className="px-6 py-3 font-medium text-center">Origem</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-gray-700 whitespace-nowrap">{formatDateBR(p.payment_date)}</td>
                  <td className="px-6 py-3 text-gray-500">{p.notes || '—'}</td>
                  <td className="px-6 py-3 text-right font-semibold text-green-700 whitespace-nowrap">
                    {formatCurrency(Number(p.amount))}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {p.imported
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">importado</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">manual</span>}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {!p.imported && <DeletePgtoButton id={p.id} />}
                  </td>
                </tr>
              ))}
              {!payments.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Nenhum pagamento registrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
