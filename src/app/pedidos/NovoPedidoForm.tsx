'use client'

import { useState, useMemo, useTransition } from 'react'
import { createOrder } from '@/lib/actions'
import { getDueDateFromString, formatCurrency, formatDateBR, todayISO } from '@/lib/billing'

interface Item { id: string; name: string; unit_price: number; active: boolean }
interface Props { items: Item[] }

export default function NovoPedidoForm({ items }: Props) {
  const [orderDate, setOrderDate]     = useState(todayISO())
  const [description, setDescription] = useState('')
  const [quantities, setQuantities]   = useState<Record<string, string>>({})
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [isPending, startTransition]  = useTransition()

  const dueDate = useMemo(() => orderDate ? getDueDateFromString(orderDate) : '', [orderDate])

  // Items already come sorted by name from the DB; keep two groups in alpha order
  const regularItems  = items.filter(i => !['Pino', 'Bucha', 'Meio'].some(p => i.name.startsWith(p)))
  const hardwareItems = items.filter(i => ['Pino', 'Bucha', 'Meio'].some(p => i.name.startsWith(p)))

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

  const total = lines.reduce((s, l) => s + l.total_price, 0)
  const setQty = (id: string, val: string) => setQuantities(prev => ({ ...prev, [id]: val }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!orderDate) { setError('Informe a data do pedido.'); return }
    if (!lines.length) { setError('Adicione ao menos um item com quantidade.'); return }

    startTransition(async () => {
      try {
        await createOrder(orderDate, description, lines)
        setQuantities({})
        setDescription('')
        setSuccess(`Pedido de ${formatCurrency(total)} registrado! Vencimento: ${formatDateBR(dueDate)}`)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar pedido.')
      }
    })
  }

  const ItemCard = ({ item }: { item: Item }) => {
    const qty = quantities[item.id] ?? ''
    const sub = qty ? Math.round(parseFloat(qty) * item.unit_price * 100) / 100 : 0
    const isHardware = ['Pino', 'Bucha', 'Meio'].some(p => item.name.startsWith(p))
    return (
      <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${qty ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
          <p className="text-xs text-gray-400">{formatCurrency(item.unit_price)}/un
            {qty ? <span className="ml-2 text-green-700 font-semibold">= {formatCurrency(sub)}</span> : ''}
          </p>
        </div>
        <input
          type="number" min="0" step={isHardware ? '1' : '0.5'}
          value={qty}
          onChange={e => setQty(item.id, e.target.value)}
          placeholder="0"
          className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none"
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Data do Pedido *</label>
          <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="input" required />
          {dueDate && (
            <p className="text-xs text-gray-500 mt-1">Vencimento: <strong>{formatDateBR(dueDate)}</strong></p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Descrição / Observação</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="ex: pedido 13/04" className="input" />
        </div>
      </div>

      {/* Itens regulares em ordem alfabética */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Itens do Pedido</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {regularItems.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      </div>

      {/* Pinos, buchas e outros em ordem alfabética */}
      {hardwareItems.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Pinos, Buchas e Outros</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hardwareItems.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-sm text-gray-500">Total do pedido</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
          {lines.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{lines.length} {lines.length === 1 ? 'item' : 'itens'}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 items-end w-full sm:w-auto">
          {error   && <p className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">{success}</p>}
          <button type="submit" disabled={isPending || lines.length === 0} className="btn-primary">
            {isPending ? 'Salvando…' : 'Registrar Pedido'}
          </button>
        </div>
      </div>
    </form>
  )
}
