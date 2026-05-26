'use client';

import { useState } from 'react';
import { Payment, Client } from '@/types';
import { formatCurrency, formatDateBR } from '@/lib/billing';
import EditPaymentModal from './EditPaymentModal';
import DeletePgtoButton from './DeletePgtoButton';

interface Props {
  payments: Payment[];
  clients: Client[];
}

export default function PagamentosTable({ payments, clients }: Props) {
  const [filterClient, setFilterClient] = useState('');
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const filtered = filterClient
    ? payments.filter(p => p.client === filterClient)
    : payments;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">Pagamentos lançados</h2>
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
              <th className="text-left px-3 py-2">Venc. Ref.</th>
              <th className="text-left px-3 py-2">Obs</th>
              <th className="text-right px-3 py-2">Valor</th>
              <th className="px-3 py-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">Nenhum pagamento encontrado</td>
              </tr>
            )}
            {filtered.map(payment => (
              <tr key={payment.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">{formatDateBR(payment.payment_date)}</td>
                <td className="px-3 py-2 font-medium">{payment.client}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                  {payment.due_date_ref ? formatDateBR(payment.due_date_ref) : '—'}
                </td>
                <td className="px-3 py-2 text-gray-600">{payment.notes || '—'}</td>
                <td className="px-3 py-2 text-right font-medium text-green-700">{formatCurrency(payment.amount)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => setEditingPayment(payment)}
                      className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                    >
                      Editar
                    </button>
                    <DeletePgtoButton id={payment.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          clients={clients}
          onClose={() => setEditingPayment(null)}
        />
      )}
    </div>
  );
}
