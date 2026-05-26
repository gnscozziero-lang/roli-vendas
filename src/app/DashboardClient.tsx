'use client'

import { useState } from 'react'
import { formatCurrency, formatDateBR, calculateBalances } from '@/lib/billing'
import { Order, Payment, Client } from '@/types'

interface Props {
  orders: Order[]
  payments: Payment[]
  clients: Client[]
  initialBalance: number
  recentOrders: Order[]
  recentPayments: Payment[]
}

export default function DashboardClient({ orders, payments, clients, initialBalance, recentOrders, recentPayments }: Props) {
  const [selectedClient, setSelectedClient] = useState('')

  const filteredOrders = selectedClient ? orders.filter(o => o.client === selectedClient) : orders
  const filteredPayments = selectedClient ? payments.filter(p => p.client === selectedClient) : payments
  const filteredRecentOrders = selectedClient ? recentOrders.filter(o => o.client === selectedClient) : recentOrders
  const filteredRecentPayments = selectedClient ? recentPayments.filter(p => p.client === selectedClient) : recentPayments
  const balanceToUse = selectedClient ? 0 : initialBalance

  const { cycles, total_open, overdue_amount, next_due_amount, next_due_date } =
    calculateBalances(filteredOrders as any, filteredPayments as any, balanceToUse)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Client filter */}
      <div className="flex items-center gap-3 print:hidden">
        <label className="label mb-0">Cliente:</label>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="input w-48">
          <option value="">Todos os clientes</option>
          {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">Total em Aberto</p>
          <p className={`text-3xl font-bold ${total_open > 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(total_open)}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">Próximo Vencimento</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(next_due_amount)}</p>
          {next_due_date && <p className="text-xs text-gray-400 mt-1">até {formatDateBR(next_due_date)}</p>}
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">Em Atraso</p>
          <p className={`text-3xl font-bold ${overdue_amount > 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(overdue_amount)}</p>
        </div>
      </div>

      {/* Cycles table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Ciclos em Aberto</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Vencimento</th>
              <th className="px-6 py-3 font-medium text-right">Total do Ciclo</th>
              <th className="px-6 py-3 font-medium text-right">Saldo</th>
              <th className="px-6 py-3 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cycles.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Nenhum ciclo em aberto</td></tr>
            )}
            {cycles.map((cycle: any) => (
              <tr key={cycle.due_date} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-medium text-gray-800">{formatDateBR(cycle.due_date)}</td>
                <td className="px-6 py-3 text-right">{formatCurrency(cycle.total_orders)}</td>
                <td className="px-6 py-3 text-right font-bold text-red-600">{formatCurrency(cycle.remaining)}</td>
                <td className="px-6 py-3 text-center">
                  {cycle.is_next_due
                    ? <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">Próximo</span>
                    : cycle.is_overdue
                    ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Vencido</span>
                    : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Futuro</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent orders + payments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Últimos Pedidos</h2>
          <div className="space-y-3">
            {filteredRecentOrders.length === 0 && <p className="text-sm text-gray-400">Nenhum pedido encontrado</p>}
            {filteredRecentOrders.slice(0, 5).map((o: any) => (
              <div key={o.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{formatDateBR(o.order_date)}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[180px]">{o.description || '—'}</p>
                  <p className="text-xs text-gray-400">{o.due_date < today ? 'venceu' : 'vence'} {formatDateBR(o.due_date)}</p>
                </div>
                <p className="text-sm font-bold text-gray-800 whitespace-nowrap">{formatCurrency(o.total_amount)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Últimos Pagamentos</h2>
          <div className="space-y-3">
            {filteredRecentPayments.length === 0 && <p className="text-sm text-gray-400">Nenhum pagamento encontrado</p>}
            {filteredRecentPayments.slice(0, 5).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{formatDateBR(p.payment_date)}</p>
                <p className="text-sm font-bold text-green-700">{formatCurrency(p.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
