'use client'

import { useTransition } from 'react'
import { deleteOrder, deletePayment } from '@/lib/actions'

interface Props {
  id: string
  type: 'order' | 'payment'
}

export default function DeleteButton({ id, type }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm('Confirma exclusão?')) return
    startTransition(async () => {
      if (type === 'order')   await deleteOrder(id)
      if (type === 'payment') await deletePayment(id)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
    >
      {isPending ? '…' : 'excluir'}
    </button>
  )
}
