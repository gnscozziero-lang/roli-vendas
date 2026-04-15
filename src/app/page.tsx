import { sql } from '@/lib/db'
import { calculateBalances, formatCurrency, formatDateBR } from '@/lib/billing'
import Link from 'next/link'

export const revalidate = 0

export default async function DashboardPage() {
  const [orders, payments, settings, recentOrders, recentPayments] = await Promise.all([
    sql`SELECT due_date, total_amount FROM orders`,
    sql`SELECT amount FROM payments`,
    sql`SELECT key, value FROM settings`,
    sql`SELECT id, order_date, due_date, total_amount, description, imported FROM orders ORDER BY order_date DESC LIMIT 8`,
    sql`SELECT id, payment_date, amount, notes, imported FROM payments ORDER BY payment_date DESC LIMIT 8`,
  ])

  const initialBalance = Number((settings as any[]).find((s: any) => s.key === 'initial_balance')?.value ?? 0)
  const summary = calculateBalances(orders as any[], payments as any[], initialBalance)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumo financeiro</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Total em Aberto</p>
          <p className={`text-3xl font-bold mt-1 ${summary.total_open > 0 ? 'text-red-600' : 'text-green-700'}`}>
            {formatCurrency(summary.total_open)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Próximo Vencimento</p>
          {summary.next_due_date ? (
            <>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.next_due_amount)}</p>
              <p className="text-sm text-gray-500 mt-1">até {formatDateBR(summary.next_due_date)}</p>
            </>
          ) : (
            <p className="text-lg text-green-700 font-semibold mt-1">Sem vencimentos</p>
          )}
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Em Atraso</p>
          <p className={`text-3xl font-bold mt-1 ${summary.overdue_amount > 0 ? 'text-red-600' : 'text-green-700'}`}>
            {formatCurrency(summary.overdue_amount)}
          </p>
        </div>
      </div>

      {summary.cycles.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Ciclos em Aberto</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Vencimento</th>
                  <th className="pb-2 font-medium text-right">Total do Ciclo</th>
                  <th className="pb-2 font-medium text-right">Saldo</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.cycles.map(c => (
                  <tr key={c.due_date}>
                    <td className="py-2 text-gray-700">{formatDateBR(c.due_date)}</td>
                    <td className="py-2 text-right text-gray-700">{formatCurrency(c.total_orders)}</td>
                    <td className="py-2 text-right font-semibold text-red-600">{formatCurrency(c.remaining)}</td>
                    <td className="py-2 text-center">
                      {c.is_next_due
                        ? <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 font-medium">Próximo</span>
                        : c.is_overdue
                        ? <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Vencido</span>
                        : <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">Futuro</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Últimos Pedidos</h2>
            <Link href="/pedidos" className="text-sm text-green-700 hover:underline">Ver todos →</Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-2">
              {(recentOrders as any[]).map((o: any) => (
                <div key={o.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-gray-700">{formatDateBR(o.order_date)}</span>
                    {o.description && <span className="text-gray-400 ml-2 text-xs">{o.description}</span>}
                    <span className="ml-2 text-xs text-gray-400">vence {formatDateBR(o.due_date)}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(Number(o.total_amount))}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhum pedido ainda.</p>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Últimos Pagamentos</h2>
            <Link href="/pagamentos" className="text-sm text-green-700 hover:underline">Ver todos →</Link>
          </div>
          {recentPayments.length > 0 ? (
            <div className="space-y-2">
              {(recentPayments as any[]).map((p: any) => (
                <div key={p.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{formatDateBR(p.payment_date)}</span>
                  <span className="font-semibold text-green-700">{formatCurrency(Number(p.amount))}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhum pagamento ainda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
