'use client'

import { useState, useTransition } from 'react'
import { createClient, updateClient, toggleClientActive } from '@/lib/actions'
import { Client } from '@/types'

export default function ClientesTable({ clients: initial }: { clients: Client[] }) {
  const [list, setList] = useState<Client[]>(initial)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [addError, setAddError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    const name = newName.trim().toUpperCase()
    if (!name) { setAddError('Informe o nome.'); return }
    startTransition(async () => {
      await createClient(name)
      window.location.reload()
    })
  }

  function handleRename(id: string) {
    const name = editingName.trim().toUpperCase()
    if (!name) return
    startTransition(async () => {
      await updateClient(id, name)
      setList(prev => prev.map(c => c.id === id ? { ...c, name } : c))
      setEditingId(null)
    })
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      await toggleClientActive(id, !active)
      setList(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c))
    })
  }

  return (
    <>
      {/* Add new client */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label text-xs">Nome do cliente</label>
            <input
              type="text" value={newName}
              onChange={e => setNewName(e.target.value.toUpperCase())}
              placeholder="ex: EMPRESA XYZ"
              className="input w-48 uppercase"
            />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary">+ Adicionar</button>
          {addError && <p className="text-sm text-red-600">{addError}</p>}
        </form>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-gray-500">
            <th className="px-6 py-3 font-medium">Nome</th>
            <th className="px-6 py-3 font-medium text-center">Status</th>
            <th className="px-6 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.length === 0 && (
            <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">Nenhum cliente cadastrado</td></tr>
          )}
          {list.map(client => (
            <tr key={client.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-3">
                {editingId === client.id ? (
                  <input
                    type="text" value={editingName}
                    onChange={e => setEditingName(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(client.id); if (e.key === 'Escape') setEditingId(null) }}
                    className="input w-48 uppercase" autoFocus
                  />
                ) : (
                  <span className={`font-medium ${client.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                    {client.name}
                  </span>
                )}
              </td>
              <td className="px-6 py-3 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${client.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {client.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  {editingId === client.id ? (
                    <>
                      <button onClick={() => handleRename(client.id)} className="text-xs text-green-700 hover:text-green-900 font-semibold">salvar</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600">cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(client.id); setEditingName(client.name) }} disabled={isPending} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                        editar nome
                      </button>
                      <button onClick={() => handleToggle(client.id, client.active)} disabled={isPending} className={`text-xs transition-colors ${client.active ? 'text-red-400 hover:text-red-600' : 'text-green-600 hover:text-green-800'}`}>
                        {client.active ? 'desativar' : 'ativar'}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
