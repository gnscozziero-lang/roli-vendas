'use client'

import { useTransition } from 'react'
import { deletePayment } from '@/lib/actions'

export default function DeletePgtoButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      onClick={() => {
        if (!confirm('Confirma exclusão do pagamento?')) return
        startTransition(() => deletePayment(id))
      }}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
    >
      {isPending ? '…' : 'excluir'}
    </button>
  )
}
