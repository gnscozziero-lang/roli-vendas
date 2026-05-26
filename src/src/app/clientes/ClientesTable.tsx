'use client';

import { useState, useTransition } from 'react';
import { createClient, updateClient, toggleClientActive } from '@/lib/actions';
import { Client } from '@/types';

export default function ClientesTable({ clients: initial }: { clients: Client[] }) {
  const [list, setList] = useState<Client[]>(initial);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleAdd() {
    const name = newName.trim().toUpperCase();
    if (!name) return;
    startTransition(async () => {
      await createClient(name);
      // Re-fetch by reloading — revalidatePath handles it server-side
      window.location.reload();
    });
  }

  async function handleRename(id: string) {
    const name = editingName.trim().toUpperCase();
    if (!name) return;
    startTransition(async () => {
      await updateClient(id, name);
      setList(prev => prev.map(c => c.id === id ? { ...c, name } : c));
      setEditingId(null);
    });
  }

  async function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      await toggleClientActive(id, !active);
      setList(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
    });
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nome do cliente"
          className="border rounded px-3 py-2 flex-1 uppercase"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !newName.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-center px-4 py-3 w-24">Status</th>
              <th className="px-4 py-3 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-400">Nenhum cliente cadastrado</td>
              </tr>
            )}
            {list.map(client => (
              <tr key={client.id} className="border-t">
                <td className="px-4 py-3">
                  {editingId === client.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value.toUpperCase())}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRename(client.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="border rounded px-2 py-1 w-full uppercase"
                      autoFocus
                    />
                  ) : (
                    <span className={client.active ? '' : 'text-gray-400 line-through'}>
                      {client.name}
                    </span>
                  )}
                </td>
                <td className="text-center px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    client.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {client.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    {editingId === client.id ? (
                      <>
                        <button
                          onClick={() => handleRename(client.id)}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(client.id); setEditingName(client.name); }}
                          className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                        >
                          Renomear
                        </button>
                        <button
                          onClick={() => handleToggle(client.id, client.active)}
                          disabled={isPending}
                          className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                        >
                          {client.active ? 'Desativar' : 'Ativar'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
