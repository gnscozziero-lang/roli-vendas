'use client'

import { useState, useMemo, useTransition } from 'react'
import { updateOrder } from '@/lib/actions'
import { getDueDateFromString, formatCurrency, formatDateBR } from '@/lib/billing'

interface Item {
  id: string
  name: string
  unit_price: number
}

interface ExistingItem {
  item_id: string | null
  item_name: string
  quantity: number
  unit_price: number
}

interface Props {
  order: {
    id: string
    order_date: string
    description: string
    total_amount: number
  }
  existingItems: ExistingItem[]
  allItems: Item[]
  onClose: () => void
}

export default function EditarPedidoForm({ order, existingItems, allItems, onClose }: Props) {
  // Inicializa quantidades com os itens existentes do pedido
  const initialQtys: Record<string, string> = {}
  for (const ei of existingItems) {
    const found = allItems.find(i => i.name === ei.item_name)
    if (found) {
      initialQtys[found.id] = String(ei.quantity)
    }
  }

  const [orderDate,    setOrderDate]   = useState(order.order_date.substring(0, 10))
  const [description,  setDescription] = useState(order.description || '')
  const [quantities,   setQuantities]  = useState<Record<string, string>>(initialQtys)
  const [error,        setError]       = useState('')
  const [success,      setSuccess]     = useState('')
  const [isPending, startTransition]   = useTransition()

  const dueDate = useMemo(() => orderDate ? getDueDateFromString(orderDate) : '', [orderDate])

  const lines = useMemo(() =>
    allItems
      .map(item => {
        const qty = parseFloat(quantities[item.id] ?? '') || 0
        return qty > 0
          ? { item_id: item.id, item_name: item.name, quantity: qty,
              unit_price: item.unit_price, total_price: Math.round(qty * item.unit_price * 100) / 100 }
          : null
      })
      .filter(Boolean) as { item_id: string; item_name: string; quantity: number; unit_price: number; total_price: number }[]
  , [allItems, quantities])

  const total = lines.reduce((s, l) => s + l.total_price, 0)
  const setQty = (id: string, val: string) => setQuantities(prev => ({ ...prev, [id]: val }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!orderDate)    { setError('Informe a data do pedido.'); return }
    if (!lines.length) { setError('Adicione ao menos um item com quantidade.'); return }

    startTransition(async () => {
      try {
        await updateOrder(order.id, orderDate, description, lines)
        setSuccess('Pedido atualizado com sucesso!')
        setTimeout(() => onClose(), 1200)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar pedido.')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Editar Pedido</h2>
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
              <label className="label">Descrição / Observação</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="ex: pedido 13/04" className="input" />
            </div>
          </div>

          {/* Itens em ordem alfabética */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Itens do Pedido</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allItems.map(item => {
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
                    <input
                      type="number" min="0" step="0.5"
                      value={qty}
                      onChange={e => setQty(item.id, e.target.value)}
                      placeholder="0"
                      className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total + ações */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Total do pedido</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
            </div>
            <div className="flex flex-col gap-2 items-end w-full sm:w-auto">
              {error   && <p className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{error}</p>}
              {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">{success}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={isPending || lines.length === 0} className="btn-primary">
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
