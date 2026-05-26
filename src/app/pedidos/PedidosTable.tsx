'use client'

import { useState } from 'react'
import { Order, Item, Client } from '@/types'
import { formatCurrency, formatDateBR } from '@/lib/billing'
import EditOrderModal from './EditOrderModal'
import DeleteButton from './DeleteButton'

export default function PedidosTable({ orders, items, clients }: { orders: Order[]; items: Item[]; clients: Client[] }) {
  const [filterClient, setFilterClient] = useState('')
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)

  const filtered = filterClient ? orders.filter(o => o.client === filterClient) : orders

  return (
    <>
      {/* Client filter — NEW */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
        <label className="text-sm font-medium text-gray-700">Filtrar por cliente:</label>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="input w-48">
          <option value="">Todos</option>
          {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-gray-500">
            <th className="px-6 py-3 font-medium">Data</th>
            <th className="px-6 py-3 font-medium">Cliente</th>
            <th className="px-6 py-3 font-medium">Descrição</th>
            <th className="px-6 py-3 font-medium">Vencimento</th>
            <th className="px-6 py-3 font-medium text-right">Valor</th>
            <th className="px-6 py-3 font-medium text-center">Origem</th>
            <th className="px-6 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Nenhum pedido encontrado</td></tr>
          )}
          {filtered.map(order => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-3 whitespace-nowrap">{formatDateBR(order.order_date)}</td>
              <td className="px-6 py-3 font-medium text-gray-800">{order.client}</td>
              <td className="px-6 py-3 text-gray-600 max-w-[180px] truncate">{order.description || '—'}</td>
              <td className="px-6 py-3 whitespace-nowrap">{formatDateBR(order.due_date)}</td>
              <td className="px-6 py-3 text-right font-semibold">{formatCurrency(Number(order.total_amount))}</td>
              <td className="px-6 py-3 text-center">
                {order.imported
                  ? <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">importado</span>
                  : <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">manual</span>
                }
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setEditingOrder(order)} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                    editar
                  </button>
                  {!order.imported && <DeleteButton id={order.id} type="order" />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingOrder && (
        <EditOrderModal order={editingOrder} items={items} clients={clients} onClose={() => setEditingOrder(null)} />
      )}
    </>
  )
}
