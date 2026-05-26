'use client';

import { useState, useEffect, useCallback } from 'react';
import { createOrder } from '@/lib/actions';
import { Item, Client } from '@/types';

// ─── ItemQtyInput DEFINED OUTSIDE PARENT — prevents focus loss bug ────────────
function ItemQtyInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      step={0.01}
      value={value === 0 ? '' : value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="border rounded px-2 py-1 w-24 text-right"
      placeholder="0"
    />
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function calcDueDate(orderDate: string): string {
  const d = new Date(orderDate + 'T12:00:00');
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  if (day <= 15) {
    // due on 30th of same month
    return `${year}-${String(month + 1).padStart(2, '0')}-30`;
  } else {
    // due on 30th of next month
    const next = new Date(year, month + 1, 30);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-30`;
  }
}

interface Props {
  items: Item[];
  clients: Client[];
}

export default function NovoPedidoForm({ items, clients }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [orderDate, setOrderDate] = useState(today);
  const [dueDate, setDueDate] = useState(calcDueDate(today));
  const [description, setDescription] = useState('');
  const [client, setClient] = useState(clients[0]?.name ?? '');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDueDate(calcDueDate(orderDate));
  }, [orderDate]);

  const setQty = useCallback((id: string, val: number) => {
    setQuantities(prev => ({ ...prev, [id]: val }));
  }, []);

  const regularItems = items.filter(i => i.active && !['pinos', 'buchas', 'hardware'].some(k => i.name.toLowerCase().includes(k)));
  const hardwareItems = items.filter(i => i.active && ['pinos', 'buchas', 'hardware'].some(k => i.name.toLowerCase().includes(k)));

  const selectedItems = items
    .filter(i => (quantities[i.id] ?? 0) > 0)
    .map(i => ({
      item_id: i.id,
      item_name: i.name,
      quantity: quantities[i.id],
      unit_price: i.unit_price,
    }));

  const total = selectedItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedItems.length === 0) return alert('Selecione ao menos um item.');
    if (!client) return alert('Selecione um cliente.');

    setSubmitting(true);
    const fd = new FormData();
    fd.append('order_date', orderDate);
    fd.append('due_date', dueDate);
    fd.append('description', description);
    fd.append('client', client);
    fd.append('items', JSON.stringify(selectedItems));

    await createOrder(fd);
    setQuantities({});
    setDescription('');
    setSubmitting(false);
  }

  function renderItemGroup(group: Item[], label: string) {
    if (group.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{label}</p>
        <div className="space-y-2">
          {group.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm">{item.name}</span>
              <span className="text-xs text-gray-400 w-20 text-right">
                R$ {item.unit_price.toFixed(2)}
              </span>
              <ItemQtyInput
                value={quantities[item.id] ?? 0}
                onChange={v => setQty(item.id, v)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold">Novo Pedido</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cliente *</label>
          <select
            value={client}
            onChange={e => setClient(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">Selecione...</option>
            {clients.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data do Pedido</label>
          <input
            type="date"
            value={orderDate}
            onChange={e => setOrderDate(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Vencimento
            <span className="ml-2 text-xs font-normal text-gray-400">(sugerido — editável)</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Opcional"
            className="border rounded px-3 py-2 w-full"
          />
        </div>
      </div>

      <div className="border rounded p-4">
        {renderItemGroup(regularItems, 'Itens')}
        {renderItemGroup(hardwareItems, 'Hardware / Pinos / Buchas')}
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm font-medium">
          Total: <span className="text-blue-700 font-bold">R$ {total.toFixed(2)}</span>
        </span>
        <button
          type="submit"
          disabled={submitting || selectedItems.length === 0}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Salvando...' : 'Salvar Pedido'}
        </button>
      </div>
    </form>
  );
}
