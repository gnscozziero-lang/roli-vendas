'use client'

import { useState, useEffect, useCallback } from 'react'
import { updateOrder } from '@/lib/actions'
import { Order, Item, Client } from '@/types'
import { formatCurrency, formatDateISO } from '@/lib/billing'

function toISO(val: any): string {
  if (!val) return ''
  if (val instanceof Date) return formatDateISO(val)
  return String(val).substring(0, 10)
}

function ItemQtyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number" min={0} step={0.5}
      value={value === 0 ? '' : value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      placeholder="0"
      className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none"
    />
  )
}

interface Props { order: Order; items: Item[]; clients: Client[]; onClose: () => void }

export default function EditOrderModal({ order, items, clients, onClose }: Props) {
  const [orderDate, setOrderDate] = useState(order.order_date)
  const [dueDate, setDueDate] = useState(order.due_date)
  const [description, setDescription] = useState(order.description || '')
  const [client, setClient] = useState(order.client || '')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch(`/api/orders?order_id=${order.id}`)
      .then(r => r.json())
      .then((data: any) => {
        const rows = Array.isArray(data) ? data : (data.items ?? [])
        const qMap: Record<string, number> = {}
        rows.forEach((oi: any) => { qMap[oi.item_id] = Number(oi.quantity) })
        setQuantities(qMap)
      })
  }, [order.id])

  const setQty = useCallback((id: string, val: number) => {
    setQuantities(prev => ({ ...prev, [id]: val }))
  }, [])

  const selectedItems = items.filter(i => (quantities[i.id] ?? 0) > 0).map(i => ({
    item_id: i.id, item_name: i.name, quantity: quantities[i.id], unit_price: Number(i.unit_price),
  }))
  const total = selectedItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItems.length) { setError('Adicione ao menos um item.'); return }
    setSubmitting(true)
    setError('')
    try {
      await updateOrder(order.id, orderDate, dueDate, description, client, selectedItems)
      setSuccess('Pedido atualizado com sucesso!')
      setTimeout(() => onClose(), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    }
    setSubmitting(false)
  }

  const regularItems = items.filter(i => !['pinos', 'buchas', 'hardware', 'meio'].some(k => i.name.toLowerCase().includes(k)))
  const hardwareItems = items.filter(i => ['pinos', 'buchas', 'hardware', 'meio'].some(k => i.name.toLowerCase().includes(k)))

  function renderGroup(group: Item[], label: string) {
    if (!group.length) return null
    return (
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {group.map(item => {
            const qty = quantities[item.id] ?? 0
            const sub = qty ? Math.round(qty * Number(item.unit_price) * 100) / 100 : 0
            return (
              <div key={item.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${qty ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    R$ {Number(item.unit_price).toFixed(2)}/un
                    {qty ? <span className="ml-2 text-green-700 font-semibold">= R$ {sub.toFixed(2)}</span> : ''}
                  </p>
                </div>
                <ItemQtyInput value={qty} onChange={v => setQty(item.id, v)} />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Editar Pedido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Cliente *</label>
              <select value={client} onChange={e => setClient(e.target.value)} required className="input">
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Data do Pedido</label>
              <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">Vencimento <span className="font-normal text-gray-400">(editável)</span></label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">Descrição</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input" />
            </div>
          </div>

          {renderGroup(regularItems, 'Itens do Pedido')}
          {renderGroup(hardwareItems, 'Pinos, Buchas e Outros')}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Total do pedido</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{error}</p>}
              {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">{success}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Salvando…' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
