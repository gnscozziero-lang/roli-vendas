'use client';

import { useState } from 'react';
import { updatePayment } from '@/lib/actions';
import { Payment, Client } from '@/types';

interface Props {
  payment: Payment;
  clients: Client[];
  onClose: () => void;
}

export default function EditPaymentModal({ payment, clients, onClose }: Props) {
  const [paymentDate, setPaymentDate] = useState(payment.payment_date);
  const [amount, setAmount] = useState(String(payment.amount));
  const [notes, setNotes] = useState(payment.notes || '');
  const [dueDateRef, setDueDateRef] = useState(payment.due_date_ref || '');
  const [client, setClient] = useState(payment.client || '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await updatePayment(
      payment.id,
      paymentDate,
      parseFloat(amount),
      notes,
      dueDateRef || null,
      client
    );
    setSubmitting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Editar Pagamento #{payment.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cliente *</label>
            <select
              value={client}
              onChange={e => setClient(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
            >
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data do Pagamento</label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Vencimento de referência
            </label>
            <input
              type="date"
              value={dueDateRef}
              onChange={e => setDueDateRef(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
