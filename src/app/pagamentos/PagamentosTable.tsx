'use client'

import { useState } from 'react'
import { Payment, Client } from '@/types'
import { formatCurrency, formatDateBR } from '@/lib/billing'
import EditPaymentModal from './EditPaymentModal'
import DeletePgtoButton from './DeletePgtoButton'

export default function PagamentosTable({ payments, clients }: { payments: Payment[]; clients: Client[] }) {
  const [filterClient, setFilterClient] = useState('')
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)

  const filtered = filterClient ? payments.filter(p => p.client === filterClient) : payments

  return (
    <>
      {/* Client filter — NEW */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
        <label className="text-sm font-medium text-gray-700">Filtrar por cliente:</label>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="input w-48">
          <option value="">Todos</option>
          {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-gray-500">
            <th className="px-6 py-3 font-medium">Data</th>
            <th className="px-6 py-3 font-medium">Cliente</th>
            <th className="px-6 py-3 font-medium">Observação</th>
            <th className="px-6 py-3 font-medium">Referente ao venc.</th>
            <th className="px-6 py-3 font-medium text-right">Valor</th>
            <th className="px-6 py-3 font-medium text-center">Origem</th>
            <th className="px-6 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Nenhum pagamento encontrado</td></tr>
          )}
          {filtered.map(payment => (
            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-3 whitespace-nowrap">{formatDateBR(payment.payment_date)}</td>
              <td className="px-6 py-3 font-medium text-gray-800">{payment.client}</td>
              <td className="px-6 py-3 text-gray-600">{payment.notes || '—'}</td>
              <td className="px-6 py-3">
                {payment.due_date_ref
                  ? <span className="font-semibold text-green-700">{formatDateBR(payment.due_date_ref)}</span>
                  : <span className="text-gray-400 italic text-xs">não definido</span>
                }
              </td>
              <td className="px-6 py-3 text-right font-semibold text-green-700">{formatCurrency(Number(payment.amount))}</td>
              <td className="px-6 py-3 text-center">
                {payment.imported
                  ? <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">importado</span>
                  : <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">manual</span>
                }
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setEditingPayment(payment)} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">editar</button>
                  {!payment.imported && <DeletePgtoButton id={payment.id} />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingPayment && (
        <EditPaymentModal payment={editingPayment} clients={clients} onClose={() => setEditingPayment(null)} />
      )}
    </>
  )
}
