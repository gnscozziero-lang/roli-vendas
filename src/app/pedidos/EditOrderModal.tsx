'use client'

import { useState, useMemo, useTransition } from 'react'
import { updateOrder, updateOrderImported } from '@/lib/actions'
import { getDueDateFromString, formatCurrency, formatDateBR } from '@/lib/billing'

interface Item {
  id: string
  name: string
  unit_price: number
  active: boolean
}

interface OrderItem {
  item_id: string | null
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_date: string
  due_date: string
  total_amount: number
  description: string
  imported: boolean
  order_items?: OrderItem[]
}

interface Props {
  order: Order
  items: Item[]
  onClose: () => void
}

export default function EditOrderModal({ order, items, onClose }: Props) {
  const toISO = (v: unknown) => v instanceof Date
    ? v.toISOString().substring(0, 10)
    : String(v).substring(0, 10)

  const [orderDate, setOrderDate]     = useState(toISO(order.order_date))
  const [description, setDescription] = useState(order.description || '')
  const [totalManual, setTotalManual] = useState(String(order.total_amount))
  const [quantities, setQuantities]   = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const oi of order.order_items ?? []) {
      if (oi.item_id) init[oi.item_id] = String(oi.quantity)
    }
    return init
  })
  const [error, setError]   = useState('')
  const [isPending, startTransition] = useTransition()

  const dueDate = useMemo(() =>
    orderDate ? getDueDateFromString(orderDate) : '', [orderDate])

  const hasItems = (order.order_items ?? []).length > 0

  const lines = useMemo(() =>
    items
      .map(item => {
        const qty = parseFloat(quantities[item.id] ?? '') || 0
        return qty > 0
          ? { item_id: item.id, item_name: item.name, quantity: qty,
              unit_price: item.unit_price,
              total_price: Math.round(qty * item.unit_price * 100) / 100 }
          : null
      })
      .filter(Boolean) as { item_id: string; item_name: string; quantity: number; unit_price: number; total_price: number }[]
  , [items, quantities])

  const total = hasItems || !order.imported
    ? lines.reduce((s, l) => s + l.total_price, 0)
    : parseFloat(totalManual) || 0

  const setQty = (id: string, val: string) =>
    setQuantities(prev => ({ ...prev, [id]: val }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      try {
        if (order.imported && !hasItems) {
          // Pedido importado sem itens: edita data, descrição e total
          const amount = parseFloat(totalManual)
          if (!amount || amount <= 0) { setError('Valor inválido.'); return }
          await updateOrderImported(order.id, orderDate, description, amount)
        } else {
          // Pedido com itens: edita via linhas
          if (!lines.length) { setError('Adicione ao menos um item.'); return }
          await updateOrder(order.id, orderDate, description, lines)
        }
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar.')
      }
    })
  }

  // Items in alphabetical order, split into regular and hardware
  const regularItems  = items.filter(i => !['Pino', 'Bucha', 'Meio'].some(p => i.name.startsWith(p)))
  const hardwareItems = items.filter(i => ['Pino', 'Bucha', 'Meio'].some(p => i.name.startsWith(p)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Editar Pedido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Data + descrição */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Data do Pedido *</label>
              <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                className="input" required />
              {dueDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Vencimento: <strong>{formatDateBR(dueDate)}</strong>
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Descrição</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                className="input" />
            </div>
          </div>

          {/* Pedido importado sem itens: só edita total */}
          {order.imported && !hasItems ? (
            <div>
              <label className="label">Valor Total (R$) *</label>
              <input type="number" min="0.01" step="0.01" value={totalManual}
                onChange={e => setTotalManual(e.target.value)} className="input w-48" required />
              <p className="text-xs text-gray-400 mt-1">
                Pedido importado — edite o valor total diretamente.
              </p>
            </div>
          ) : (
            <>
              {/* Itens regulares */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Itens do Pedido</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {regularItems.map(item => {
                    const qty = quantities[item.id] ?? ''
                    const sub = qty ? Math.round(parseFloat(qty) * item.unit_price * 100) / 100 : 0
                    return (
                      <div key={item.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${qty ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">{formatCurrency(item.unit_price)}/un
                            {qty ? <span className="ml-2 text-green-700 font-semibold">= {formatCurrency(sub)}</span> : ''}
                          </p>
                        </div>
                        <input type="number" min="0" step="0.5" value={qty}
                          onChange={e => setQty(item.id, e.target.value)}
                          placeholder="0"
                          className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pinos e buchas */}
              {hardwareItems.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Pinos, Buchas e Outros</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {hardwareItems.map(item => {
                      const qty = quantities[item.id] ?? ''
                      const sub = qty ? Math.round(parseFloat(qty) * item.unit_price * 100) / 100 : 0
                      return (
                        <div key={item.id}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${qty ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">{formatCurrency(item.unit_price)}/un
                              {qty ? <span className="ml-2 text-green-700 font-semibold">= {formatCurrency(sub)}</span> : ''}
                            </p>
                          </div>
                          <input type="number" min="0" step="1" value={qty}
                            onChange={e => setQty(item.id, e.target.value)}
                            placeholder="0"
                            className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Total + botões */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Total do pedido</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending ? 'Salvando…' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
