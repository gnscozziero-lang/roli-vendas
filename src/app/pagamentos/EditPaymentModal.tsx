'use client'

import { useState, useTransition } from 'react'
import { updatePayment } from '@/lib/actions'
import { formatCurrency, formatDateBR } from '@/lib/billing'

interface Ciclo { due_date: string }
interface Payment {
  id: string
  payment_date: string
  amount: number
  notes: string
  due_date_ref: string | null
}
interface Props {
  payment: Payment
  ciclos: Ciclo[]
  onClose: () => void
}

export default function EditPaymentModal({ payment, ciclos, onClose }: Props) {
  const toISO = (v: unknown) => !v ? '' : v instanceof Date ? v.toISOString().substring(0, 10) : String(v).substring(0, 10)

  const [date,    setDate]    = useState(toISO(payment.payment_date))
  const [amount,  setAmount]  = useState(String(payment.amount))
  const [notes,   setNotes]   = useState(payment.notes || '')
  const [dueRef,  setDueRef]  = useState(toISO(payment.due_date_ref) || '')
  const [error,   setError]   = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const value = parseFloat(amount)
    if (!date)             { setError('Informe a data.'); return }
    if (!value || value<=0){ setError('Informe um valor válido.'); return }
    if (!dueRef)           { setError('Selecione o vencimento de referência.'); return }

    startTransition(async () => {
      try {
        await updatePayment(payment.id, date, value, notes, dueRef)
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Editar Pagamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data do Pagamento *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="input" required />
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input type="number" min="0.01" step="0.01"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="input" required />
            </div>
          </div>

          <div>
            <label className="label">Referente ao vencimento *</label>
            <select value={dueRef} onChange={e => setDueRef(e.target.value)} className="input" required>
              <option value="">Selecione…</option>
              {ciclos.map(c => (
                <option key={c.due_date} value={c.due_date}>
                  {formatDateBR(c.due_date)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Observação</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="ex: PIX 06/04" className="input" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? 'Salvando…' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
