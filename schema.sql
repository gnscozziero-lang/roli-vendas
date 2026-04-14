'use client'

import { useState, useTransition } from 'react'
import { updateItemPrice, toggleItemActive, addItem } from '@/lib/actions'
import { formatCurrency } from '@/lib/billing'
import type { Item } from '@/types'

interface Props { items: Item[] }

export default function ItemsTable({ items }: Props) {
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editPrice, setEditPrice]   = useState('')
  const [newName,   setNewName]     = useState('')
  const [newPrice,  setNewPrice]    = useState('')
  const [addError,  setAddError]    = useState('')
  const [isPending, startTransition] = useTransition()

  const startEdit = (item: Item) => {
    setEditingId(item.id)
    setEditPrice(String(item.unit_price))
  }

  const saveEdit = (id: string) => {
    const price = parseFloat(editPrice)
    if (!price || price <= 0) return
    startTransition(async () => {
      await updateItemPrice(id, price)
      setEditingId(null)
    })
  }

  const toggleActive = (id: string, active: boolean) => {
    startTransition(() => toggleItemActive(id, !active))
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    const price = parseFloat(newPrice)
    if (!newName.trim()) { setAddError('Informe o nome.'); return }
    if (!price || price <= 0) { setAddError('Informe um preço válido.'); return }
    startTransition(async () => {
      try {
        await addItem(newName.trim(), price)
        setNewName('')
        setNewPrice('')
      } catch (err: unknown) {
        setAddError(err instanceof Error ? err.message : 'Erro ao adicionar item.')
      }
    })
  }

  return (
    <>
      {/* Add new item */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label text-xs">Nome do novo item</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="ex: Novidade Par" className="input w-48" />
          </div>
          <div>
            <label className="label text-xs">Preço unitário (R$)</label>
            <input type="number" min="0.01" step="0.01" value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              placeholder="0,00" className="input w-28" />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary">
            + Adicionar
          </button>
          {addError && <p className="text-sm text-red-600">{addError}</p>}
        </form>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-gray-500">
            <th className="px-6 py-3 font-medium">Item</th>
            <th className="px-6 py-3 font-medium text-right">Preço Unitário</th>
            <th className="px-6 py-3 font-medium text-center">Status</th>
            <th className="px-6 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(item => (
            <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.active ? 'opacity-50' : ''}`}>
              <td className="px-6 py-3 font-medium text-gray-800">{item.name}</td>
              <td className="px-6 py-3 text-right">
                {editingId === item.id ? (
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number" min="0.01" step="0.01"
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null) }}
                      autoFocus
                      className="w-24 rounded-md border border-green-400 px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-600"
                    />
                    <button onClick={() => saveEdit(item.id)} disabled={isPending}
                      className="text-xs text-green-700 font-semibold hover:text-green-900">✓</button>
                    <button onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                ) : (
                  <span className="font-semibold text-gray-900">{formatCurrency(item.unit_price)}</span>
                )}
              </td>
              <td className="px-6 py-3 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {item.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  {editingId !== item.id && (
                    <button onClick={() => startEdit(item)} disabled={isPending}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                      editar preço
                    </button>
                  )}
                  <button onClick={() => toggleActive(item.id, item.active)} disabled={isPending}
                    className={`text-xs transition-colors ${item.active ? 'text-red-400 hover:text-red-600' : 'text-green-600 hover:text-green-800'}`}>
                    {item.active ? 'desativar' : 'ativar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                Nenhum item cadastrado. Execute a importação primeiro.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}
