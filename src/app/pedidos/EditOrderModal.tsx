'use client';

import { useState, useEffect, useCallback } from 'react';
import { updateOrder } from '@/lib/actions';
import { Order, Item, Client } from '@/types';
import { formatCurrency, formatDateISO } from '@/lib/billing';

// Local helper — Neon returns Date objects
function toISO(val: any): string {
  if (!val) return '';
  if (val instanceof Date) return formatDateISO(val);
  return String(val).substring(0, 10);
}

// ─── ItemQtyInput DEFINED OUTSIDE PARENT — prevents focus loss bug ────────────
function ItemQtyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number" min={0} step={0.01}
      value={value === 0 ? '' : value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="border rounded px-2 py-1 w-24 text-right"
      placeholder="0"
    />
  );
}
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  order: Order;
  items: Item[];
  clients: Client[];
  onClose: () => void;
}

export default function EditOrderModal({ order, items, clients, onClose }: Props) {
  const [orderDate, setOrderDate] = useState(order.order_date);
  const [dueDate, setDueDate] = useState(order.due_date);
  const [description, setDescription] = useState(order.description || '');
  const [client, setClient] = useState(order.client || '');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/orders?order_id=${order.id}`)
      .then(r => r.json())
      .then((orderItems: any[]) => {
        const qMap: Record<string, number> = {};
        orderItems.forEach(oi => { qMap[oi.item_id] = oi.quantity; });
        setQuantities(qMap);
      });
  }, [order.id]);

  const setQty = useCallback((id: string, val: number) => {
    setQuantities(prev => ({ ...prev, [id]: val }));
  }, []);

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
    setSubmitting(true);
    await updateOrder(order.id, orderDate, dueDate, description, client, selectedItems);
    setSubmitting(false);
    onClose();
  }

  const regularItems = items.filter(i => !['pinos', 'buchas', 'hardware'].some(k => i.name.toLowerCase().includes(k)));
  const hardwareItems = items.filter(i => ['pinos', 'buchas', 'hardware'].some(k => i.name.toLowerCase().includes(k)));

  function renderGroup(group: Item[], label: string) {
    if (group.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{label}</p>
        <div className="space-y-2">
          {group.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm">{item.name}</span>
              <span className="text-xs text-gray-400 w-20 text-right">R$ {item.unit_price.toFixed(2)}</span>
              <ItemQtyInput value={quantities[item.id] ?? 0} onChange={v => setQty(item.id, v)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Editar Pedido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cliente *</label>
              <select value={client} onChange={e => setClient(e.target.value)} required className="border rounded px-3 py-2 w-full">
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data do Pedido</label>
              <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vencimento <span className="text-xs font-normal text-gray-400">(editável)</span></label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="border rounded px-3 py-2 w-full" />
            </div>
          </div>
          <div className="border rounded p-4">
            {renderGroup(regularItems, 'Itens')}
            {renderGroup(hardwareItems, 'Hardware / Pinos / Buchas')}
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium">Total: <span className="text-blue-700 font-bold">{formatCurrency(total)}</span></span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
