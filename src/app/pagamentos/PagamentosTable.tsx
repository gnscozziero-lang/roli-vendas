'use client'

import { useState } from 'react'
import { formatCurrency, formatDateBR } from '@/lib/billing'
import DeletePgtoButton from './DeletePgtoButton'
import EditPaymentModal from './EditPaymentModal'

interface Ciclo { due_date: string }
interface Payment {
  id: string
  payment_date: string
  amount: number
  notes: string
  imported: boolean
  due_date_ref: string | null
}
interface Props { payments: Payment[]; ciclos: Ciclo[] }

function toISO(v: unknown) {
  if (!v) return ''
  if (v instanceof Date) return v.toISOString().substring(0, 10)
  return String(v).substring(0, 10)
}

export default function PagamentosTable({ payments, ciclos }: Props) {
  const [editingPayment, setEditingPayment] = useState<any | null>(null)

  return (
    <>
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          ciclos={ciclos}
          onClose={() => setEditingPayment(null)}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-6 py-3 font-medium">Data</th>
              <th className="px-6 py-3 font-medium">Observação</th>
              <th className="px-6 py-3 font-medium">Referente ao venc.</th>
              <th className="px-6 py-3 font-medium text-right">Valor</th>
              <th className="px-6 py-3 font-medium text-center">Origem</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-gray-700 whitespace-nowrap">{formatDateBR(toISO(p.payment_date))}</td>
                <td className="px-6 py-3 text-gray-500">{p.notes || '—'}</td>
                <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                  {p.due_date_ref
                    ? <span className="font-medium text-green-700">{formatDateBR(toISO(p.due_date_ref))}</span>
                    : <span className="text-gray-300 italic text-xs">não definido</span>}
                </td>
                <td className="px-6 py-3 text-right font-semibold text-green-700 whitespace-nowrap">
                  {formatCurrency(Number(p.amount))}
                </td>
                <td className="px-6 py-3 text-center">
                  {p.imported
                    ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">importado</span>
                    : <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">manual</span>}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setEditingPayment({
                        ...p,
                        payment_date: toISO(p.payment_date),
                        due_date_ref: toISO(p.due_date_ref),
                      })}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      editar
                    </button>
                    {!p.imported && <DeletePgtoButton id={p.id} />}
                  </div>
                </td>
              </tr>
            ))}
            {!payments.length && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhum pagamento registrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
