'use client'

import { useState, useTransition } from 'react'
import { createPayment } from '@/lib/actions'
import { formatCurrency, formatDateBR, todayISO } from '@/lib/billing'

interface Ciclo { due_date: string }
interface Props {
  totalOpen: number
  nextDueAmount: number
  nextDueDate: string | null
  ciclos: Ciclo[]
}

export default function NovoPagamentoForm({ totalOpen, nextDueAmount, nextDueDate, ciclos }: Props) {
  const [date,     setDate]     = useState(todayISO())
  const [amount,   setAmount]   = useState('')
  const [notes,    setNotes]    = useState('')
  const [dueRef,   setDueRef]   = useState(nextDueDate ?? '')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const value = parseFloat(amount)
    if (!date)              { setError('Informe a data.'); return }
    if (!value || value<=0) { setError('Informe um valor válido.'); return }
    if (!dueRef)            { setError('Selecione o vencimento ao qual este pagamento se refere.'); return }

    startTransition(async () => {
      try {
        await createPayment(date, value, notes, dueRef)
        setAmount('')
        setNotes('')
        setSuccess(`Pagamento de ${formatCurrency(value)} registrado — referente ao vencimento de ${formatDateBR(dueRef)}.`)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao registrar pagamento.')
      }
    })
  }

  const fill = (val: number) => setAmount(String(val))

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="label">Data do Pagamento *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="input" required />
        </div>

        <div>
          <label className="label">Valor (R$) *</label>
          <input
            type="number" min="0.01" step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0,00"
            className="input"
            required
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {nextDueDate && nextDueAmount > 0 && (
              <button type="button" onClick={() => fill(nextDueAmount)}
                className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors">
                Próx. venc. {formatCurrency(nextDueAmount)}
              </button>
            )}
            {totalOpen > 0 && (
              <button type="button" onClick={() => fill(totalOpen)}
                className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                Total {formatCurrency(totalOpen)}
              </button>
            )}
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
          <p className="text-xs text-gray-400 mt-1">Ciclo ao qual este pagamento pertence</p>
        </div>

        <div>
          <label className="label">Observação</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="ex: PIX 06/04" className="input" />
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
        <strong>Atenção:</strong> selecione o vencimento ao qual o pagamento se refere, independente da data em que foi recebido.
        O extrato e o saldo serão calculados com base nessa referência.
      </div>

      {error   && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Salvando…' : 'Registrar Pagamento'}
      </button>
    </form>
  )
}
