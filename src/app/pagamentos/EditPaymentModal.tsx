'use client'

import { useState } from 'react'
import { updatePayment } from '@/lib/actions'
import { Payment, Client } from '@/types'

interface Props { payment: Payment; clients: Client[]; onClose: () => void }

export default function EditPaymentModal({ payment, clients, onClose }: Props) {
  const [paymentDate, setPaymentDate] = useState(payment.payment_date)
  const [amount, setAmount] = useState(String(payment.amount))
  const [notes, setNotes] = useState(payment.notes || '')
  const [dueDateRef, setDueDateRef] = useState(payment.due_date_ref || '')
  const [client, setClient] = useState(payment.client || '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await updatePayment(payment.id, paymentDate, parseFloat(amount), notes, dueDateRef || null, client)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Editar Pagamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <select value={client} onChange={e => setClient(e.target.value)} required className="input">
              {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data</label>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="input" />
            </div>
          </div>
          <div>
            <label className="label">Referente ao vencimento</label>
            <input type="date" value={dueDateRef} onChange={e => setDueDateRef(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Observação</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="input" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
