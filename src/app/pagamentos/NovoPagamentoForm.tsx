'use client';

import { useState } from 'react';
import { createPayment } from '@/lib/actions';
import { Client } from '@/types';

interface Props {
  clients: Client[];
  dueDateOptions: string[]; // list of unique due_dates from orders for the dropdown
}

export default function NovoPagamentoForm({ clients, dueDateOptions }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [paymentDate, setPaymentDate] = useState(today);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDateRef, setDueDateRef] = useState('');
  const [client, setClient] = useState(clients[0]?.name ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return alert('Informe um valor válido.');
    if (!client) return alert('Selecione um cliente.');

    setSubmitting(true);
    const fd = new FormData();
    fd.append('payment_date', paymentDate);
    fd.append('amount', amount);
    fd.append('notes', notes);
    fd.append('due_date_ref', dueDateRef);
    fd.append('client', client);
    await createPayment(fd);

    setAmount('');
    setNotes('');
    setDueDateRef('');
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold">Novo Pagamento</h2>

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
            min="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Vencimento de referência
            <span className="ml-2 text-xs font-normal text-gray-400">(ciclo quitado)</span>
          </label>
          <select
            value={dueDateRef}
            onChange={e => setDueDateRef(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">Não especificado</option>
            {dueDateOptions.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Observações</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Salvando...' : 'Salvar Pagamento'}
        </button>
      </div>
    </form>
  );
}
