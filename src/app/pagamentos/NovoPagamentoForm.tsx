'use client'

import { useState } from 'react'
import { createPayment } from '@/lib/actions'
import { Client } from '@/types'
import { formatCurrency } from '@/lib/billing'

interface Props { clients: Client[]; dueDateOptions: string[]; nextDueAmount?: number; totalOpen?: number }

export default function NovoPagamentoForm({ clients, dueDateOptions, nextDueAmount = 0, totalOpen = 0 }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [paymentDate, setPaymentDate] = useState(today)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDateRef, setDueDateRef] = useState(dueDateOptions[0] ?? '')
  const [client, setClient] = useState(clients[0]?.name ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return alert('Informe um valor válido.')
    if (!client) return alert('Selecione um cliente.')
    setSubmitting(true)
    const fd = new FormData()
    fd.append('payment_date', paymentDate)
    fd.append('amount', amount)
    fd.append('notes', notes)
    fd.append('due_date_ref', dueDateRef)
    fd.append('client', client)
    await createPayment(fd)
    setAmount('')
    setNotes('')
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cliente — NEW */}
        <div>
          <label className="label">Cliente *</label>
          <select value={client} onChange={e => setClient(e.target.value)} required className="input">
            <option value="">Selecione...</option>
            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        {/* Data */}
        <div>
          <label className="label">Data</label>
          <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="input" />
        </div>
        {/* Valor */}
        <div>
          <label className="label">Valor (R$)</label>
          <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="input" placeholder="0,00" />
          <div className="flex gap-2 mt-1">
            {nextDueAmount > 0 && (
              <button type="button" onClick={() => setAmount(String(nextDueAmount))} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full hover:bg-yellow-200">
                Próx. venc. {formatCurrency(nextDueAmount)}
              </button>
            )}
            {totalOpen > 0 && (
              <button type="button" onClick={() => setAmount(String(totalOpen))} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full hover:bg-red-200">
                Total {formatCurrency(totalOpen)}
              </button>
            )}
          </div>
        </div>
        {/* Referente ao vencimento */}
        <div>
          <label className="label">Referente ao vencimento</label>
          <select value={dueDateRef} onChange={e => setDueDateRef(e.target.value)} className="input">
            <option value="">Não especificado</option>
            {dueDateOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Ciclo ao qual o pagamento se refere</p>
        </div>
      </div>
      {/* Observação */}
      <div>
        <label className="label">Observação</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="input" placeholder="Opcional" />
      </div>
      {/* Aviso */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
        Atenção: selecione o vencimento ao qual o pagamento se refere para que o extrato seja gerado corretamente.
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Salvando…' : 'Registrar Pagamento'}
        </button>
      </div>
    </form>
  )
}
