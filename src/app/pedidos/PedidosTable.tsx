'use client'

import { useState } from 'react'
import { formatCurrency, formatDateBR } from '@/lib/billing'
import DeleteButton from './DeleteButton'
import EditOrderModal from './EditOrderModal'

interface Item { id: string; name: string; unit_price: number; active: boolean }
interface Order {
  id: string; order_date: string; due_date: string
  total_amount: number; description: string; imported: boolean
}
interface Props { orders: Order[]; items: Item[] }

function toISO(v: unknown) {
  if (!v) return ''
  if (v instanceof Date) return v.toISOString().substring(0, 10)
  return String(v).substring(0, 10)
}

export default function PedidosTable({ orders, items }: Props) {
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const openEdit = async (order: Order) => {
    setLoadingId(order.id)
    try {
      const res = await fetch(`/api/orders?id=${order.id}`)
      const data = await res.json()
      setEditingOrder({
        ...order,
        order_date: toISO(order.order_date),
        due_date:   toISO(order.due_date),
        order_items: data.items ?? [],
      })
    } catch {
      setEditingOrder({
        ...order,
        order_date: toISO(order.order_date),
        due_date:   toISO(order.due_date),
        order_items: [],
      })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          items={items}
          onClose={() => setEditingOrder(null)}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Data</th>
              <th className="px-6 py-3 font-medium">Descrição</th>
              <th className="px-6 py-3 font-medium">Vencimento</th>
              <th className="px-6 py-3 font-medium text-right">Valor</th>
              <th className="px-6 py-3 font-medium text-center">Origem</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-gray-700 whitespace-nowrap">{formatDateBR(toISO(o.order_date))}</td>
                <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{o.description || '—'}</td>
                <td className="px-6 py-3 text-gray-700 whitespace-nowrap">{formatDateBR(toISO(o.due_date))}</td>
                <td className="px-6 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                  {formatCurrency(Number(o.total_amount))}
                </td>
                <td className="px-6 py-3 text-center">
                  {o.imported
                    ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">importado</span>
                    : <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">manual</span>}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => openEdit(o)}
                      disabled={loadingId === o.id}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors"
                    >
                      {loadingId === o.id ? '…' : 'editar'}
                    </button>
                    <DeleteButton id={o.id} type="order" />
                  </div>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhum pedido registrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
