'use client';

import { useState } from 'react';
import { Order, Item, Client } from '@/types';
import { formatCurrency, formatDateBR } from '@/lib/billing';
import EditOrderModal from './EditOrderModal';
import DeleteButton from './DeleteButton';

interface Props {
  orders: Order[];
  items: Item[];
  clients: Client[];
}

export default function PedidosTable({ orders, items, clients }: Props) {
  const [filterClient, setFilterClient] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const filtered = filterClient
    ? orders.filter(o => o.client === filterClient)
    : orders;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">Pedidos lançados</h2>
        <select
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="">Todos os clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-3 py-2">Data</th>
              <th className="text-left px-3 py-2">Cliente</th>
              <th className="text-left px-3 py-2">Vencimento</th>
              <th className="text-left px-3 py-2">Descrição</th>
              <th className="text-right px-3 py-2">Total</th>
              <th className="px-3 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">Nenhum pedido encontrado</td>
              </tr>
            )}
            {filtered.map(order => (
              <tr key={order.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">{formatDateBR(order.order_date)}</td>
                <td className="px-3 py-2 font-medium">{order.client}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDateBR(order.due_date)}</td>
                <td className="px-3 py-2 text-gray-600">{order.description || '—'}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(order.total_amount)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => setEditingOrder(order)}
                      className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                    >
                      Editar
                    </button>
                    <DeleteButton id={order.id} type="order" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          items={items}
          clients={clients}
          onClose={() => setEditingOrder(null)}
        />
      )}
    </div>
  );
}
