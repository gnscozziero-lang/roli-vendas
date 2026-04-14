import type { BalanceSummary, CycleBalance } from '@/types'

/**
 * Calcula a data de vencimento de um pedido.
 * Regra: compras do dia 16 ao 15 do mês seguinte → vencem no dia 30 desse mês seguinte.
 * Dias 1–15 → vence dia 30 do mesmo mês.
 * Dias 16–31 → vence dia 30 do mês seguinte.
 */
export function getDueDate(orderDate: Date): Date {
  const day   = orderDate.getDate()
  const month = orderDate.getMonth() // 0-indexed
  const year  = orderDate.getFullYear()

  if (day <= 15) {
    return new Date(year, month, 30)
  } else {
    if (month === 11) {            // Dezembro → Janeiro do ano seguinte
      return new Date(year + 1, 0, 30)
    }
    return new Date(year, month + 1, 30)
  }
}

export function getDueDateFromString(dateStr: string): string {
  // dateStr = 'YYYY-MM-DD'
  const [y, m, d] = dateStr.split('-').map(Number)
  const due = getDueDate(new Date(y, m - 1, d))
  return formatDateISO(due)
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function todayISO(): string {
  return formatDateISO(new Date())
}

/**
 * Calcula o resumo de saldos aplicando pagamentos aos ciclos mais antigos primeiro.
 *
 * @param orders    Lista de pedidos com due_date e total_amount
 * @param payments  Lista de pagamentos com amount
 * @param initialBalance  Saldo inicial (carry-forward de antes do sistema)
 */
export function calculateBalances(
  orders: { due_date: string; total_amount: number }[],
  payments: { amount: number }[],
  initialBalance: number
): BalanceSummary {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Agrupar pedidos por due_date
  const cycleMap = new Map<string, number>()

  // Saldo inicial como ciclo vencido antigo
  if (initialBalance > 0) {
    cycleMap.set('2022-12-30', initialBalance)
  }

  for (const order of orders) {
    const prev = cycleMap.get(order.due_date) ?? 0
    cycleMap.set(order.due_date, prev + order.total_amount)
  }

  // Ordenar ciclos do mais antigo ao mais novo
  const cycles: CycleBalance[] = Array.from(cycleMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([due_date, total]) => {
      const dueDate = new Date(due_date + 'T12:00:00')
      return {
        due_date,
        total_orders: total,
        remaining: total,
        is_overdue: dueDate < today,
        is_next_due: false,
      }
    })

  // Aplicar pagamentos nos ciclos mais antigos primeiro
  let remainingPayments = payments.reduce((s, p) => s + p.amount, 0)
  for (const cycle of cycles) {
    if (remainingPayments <= 0) break
    const covered = Math.min(remainingPayments, cycle.remaining)
    cycle.remaining   = round2(cycle.remaining - covered)
    remainingPayments = round2(remainingPayments - covered)
  }

  // Ciclos com saldo em aberto
  const openCycles = cycles.filter(c => c.remaining > 0)

  // Marcar o próximo vencimento futuro com saldo
  const futureCycles = openCycles.filter(c => {
    const due = new Date(c.due_date + 'T12:00:00')
    return due >= today
  })
  if (futureCycles.length > 0) {
    futureCycles[0].is_next_due = true
  }

  const total_open = round2(openCycles.reduce((s, c) => s + c.remaining, 0))
  const overdueCycles = openCycles.filter(c => c.is_overdue)
  const overdue_amount = round2(overdueCycles.reduce((s, c) => s + c.remaining, 0))
  const nextDue = openCycles.find(c => c.is_next_due)

  return {
    total_open,
    next_due_date:   nextDue?.due_date   ?? null,
    next_due_amount: nextDue?.remaining  ?? 0,
    overdue_amount,
    cycles: openCycles,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
