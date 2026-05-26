'use client'

import { useState, useEffect, useCallback } from 'react'
import { createOrder } from '@/lib/actions'
import { Item, Client } from '@/types'
import { formatDateBR } from '@/lib/billing'

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

function calcDueDate(orderDate: string): string {
  const d = new Date(orderDate + 'T12:00:00')
  const day = d.getDate(), month = d.getMonth(), year = d.getFullYear()
  if (day <= 15) return `${year}-${String(month + 1).padStart(2, '0')}-30`
  const next = new Date(year, month + 1, 30)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-30`
}

export default function NovoPedidoForm({ items, clients }: { items: Item[]; clients: Client[] }) {
  const today = new Date().toISOString().split('T')[0]
  const [orderDate, setOrderDate] = useState(today)
  const [dueDate, setDueDate] = useState(calcDueDate(today))
  const [description, setDescription] = useState('')
  const [client, setClient] = useState(clients[0]?.name ?? '')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { setDueDate(calcDueDate(orderDate)) }, [orderDate])

  const setQty = useCallback((id: string, val: number) => {
    setQuantities(prev => ({ ...prev, [id]: val }))
  }, [])

  const regularItems = items.filter(i => !['pinos', 'buchas', 'hardware', 'meio'].some(k => i.name.toLowerCase().includes(k)))
  const hardwareItems = items.filter(i => ['pinos', 'buchas', 'hardware', 'meio'].some(k => i.name.toLowerCase().includes(k)))

  const selectedItems = items.filter(i => (quantities[i.id] ?? 0) > 0).map(i => ({
    item_id: i.id, item_name: i.name, quantity: quantities[i.id], unit_price: Number(i.unit_price),
  }))
  const total = selectedItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItems.length) return alert('Adicione ao menos um item com quantidade.')
    if (!client) return alert('Selecione um cliente.')
    setSubmitting(true)
    const fd = new FormData()
    fd.append('order_date', orderDate)
    fd.append('due_date', dueDate)
    fd.append('description', description)
    fd.append('client', client)
    fd.append('items', JSON.stringify(selectedItems))
    await createOrder(fd)
    setQuantities({})
    setDescription('')
    setSubmitting(false)
  }

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
                    {qty ? <span className="ml-2 text-green-700 font-semibold">= {sub % 1 === 0 ? `R$ ${sub.toFixed(2)}` : `R$ ${sub.toFixed(2)}`}</span> : ''}
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cliente — NEW */}
        <div>
          <label className="label">Cliente *</label>
          <select value={client} onChange={e => setClient(e.target.value)} required className="input">
            <option value="">Selecione...</option>
            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        {/* Data — original */}
        <div>
          <label className="label">Data do Pedido *</label>
          <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required className="input" />
          <p className="text-xs text-gray-500 mt-1">
            Vencimento: <strong>{formatDateBR(dueDate)}</strong>
            {' '}—{' '}
            <button type="button" onClick={() => {}} className="underline text-gray-400 text-xs">alterar</button>
          </p>
        </div>
        {/* Vencimento editável — NEW */}
        <div>
          <label className="label">Vencimento <span className="font-normal text-gray-400">(editável)</span></label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="input" />
        </div>
      </div>
      {/* Descrição */}
      <div>
        <label className="label">Descrição / Observação</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="ex: pedido 13/04" className="input" />
      </div>

      {/* Items */}
      <div>
        {renderGroup(regularItems, 'Itens do Pedido')}
        {renderGroup(hardwareItems, 'Pinos, Buchas e Outros')}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-sm text-gray-500">Total do pedido · {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'}</p>
          <p className="text-2xl font-bold text-gray-900">{`R$ ${total.toFixed(2)}`}</p>
        </div>
        <button type="submit" disabled={submitting || !selectedItems.length} className="btn-primary">
          {submitting ? 'Salvando…' : 'Registrar Pedido'}
        </button>
      </div>
    </form>
  )
}
