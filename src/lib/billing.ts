import type { BalanceSummary, CycleBalance } from '@/types'

export function getDueDate(orderDate: Date): Date {
  const day   = orderDate.getDate()
  const month = orderDate.getMonth()
  const year  = orderDate.getFullYear()

  if (day <= 15) {
    return new Date(year, month, 30)
  } else {
    if (month === 11) return new Date(year + 1, 0, 30)
    return new Date(year, month + 1, 30)
  }
}

export function getDueDateFromString(dateStr: string): string {
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

// Converte qualquer formato de data (string ou Date) para string ISO YYYY-MM-DD
function toISOString(val: string | Date | unknown): string {
  if (!val) return ''
  if (val instanceof Date) return formatDateISO(val)
  const s = String(val)
  // Se vier como "2024-04-30T00:00:00.000Z" pega só os 10 primeiros chars
  return s.substring(0, 10)
}

export function formatDateBR(dateStr: string | Date | unknown): string {
  const iso = toISOString(dateStr)
  if (!iso || iso.length < 10) return ''
  const [y, m, d] = iso.split('-')
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

export function calculateBalances(
  orders: { due_date: string | Date | unknown; total_amount: number | unknown }[],
  payments: { amount: number | unknown }[],
  initialBalance: number
): BalanceSummary {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cycleMap = new Map<string, number>()

  if (initialBalance > 0) {
    cycleMap.set('2022-12-30', initialBalance)
  }

  for (const order of orders) {
    const dueDateStr = toISOString(order.due_date)
    const amount = Number(order.total_amount)
    if (!dueDateStr || isNaN(amount)) continue
    const prev = cycleMap.get(dueDateStr) ?? 0
    cycleMap.set(dueDateStr, prev + amount)
  }

  const cycles: CycleBalance[] = Array.from(cycleMap.entries())
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
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

  let remainingPayments = payments.reduce((s, p) => s + Number(p.amount), 0)
  for (const cycle of cycles) {
    if (remainingPayments <= 0) break
    const covered = Math.min(remainingPayments, cycle.remaining)
    cycle.remaining   = round2(cycle.remaining - covered)
    remainingPayments = round2(remainingPayments - covered)
  }

  const openCycles = cycles.filter(c => c.remaining > 0)

  const futureCycles = openCycles.filter(c => {
    const due = new Date(c.due_date + 'T12:00:00')
    return due >= today
  })
  if (futureCycles.length > 0) futureCycles[0].is_next_due = true

  const total_open     = round2(openCycles.reduce((s, c) => s + c.remaining, 0))
  const overdue_amount = round2(openCycles.filter(c => c.is_overdue).reduce((s, c) => s + c.remaining, 0))
  const nextDue        = openCycles.find(c => c.is_next_due)

  return {
    total_open,
    next_due_date:   nextDue?.due_date  ?? null,
    next_due_amount: nextDue?.remaining ?? 0,
    overdue_amount,
    cycles: openCycles,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
