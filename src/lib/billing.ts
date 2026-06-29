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

/**
 * Modelo de saldo por CICLO ISOLADO.
 *
 * Cada vencimento (due_date) é tratado como um ciclo independente:
 *   saldo do ciclo = pedidos daquele vencimento − pagamentos vinculados (due_date_ref) àquele MESMO vencimento.
 *
 * Pagamentos que excedem o ciclo ao qual estão vinculados (sobra), ou que apontam para um
 * due_date_ref sem pedido correspondente (órfão), rolam para a frente cronologicamente,
 * abatendo o próximo ciclo aberto. Pagamentos sem due_date_ref (legado/não vinculados) entram
 * no início da fila e são aplicados ao ciclo aberto mais antigo primeiro — mesmo comportamento
 * de "abater do mais antigo para o mais novo" já usado para o saldo inicial.
 *
 * Se, depois de percorrer todos os ciclos conhecidos, ainda restar saldo de pagamento sem
 * vencimento para absorvê-lo, esse valor é reportado como `customer_advance`
 * ("adiantamento do cliente") — não vinculado a nenhuma data específica.
 */
export function calculateBalances(
  orders: { due_date: string | Date | unknown; total_amount: number | unknown }[],
  payments: { amount: number | unknown; due_date_ref?: string | Date | unknown }[],
  initialBalance: number
): BalanceSummary {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Débitos por ciclo (pedidos + saldo inicial, se houver)
  const cycleTotals = new Map<string, number>()
  if (initialBalance > 0) {
    cycleTotals.set('2022-12-30', initialBalance)
  }
  for (const order of orders) {
    const dueDateStr = toISOString(order.due_date)
    const amount = Number(order.total_amount)
    if (!dueDateStr || isNaN(amount)) continue
    cycleTotals.set(dueDateStr, round2((cycleTotals.get(dueDateStr) ?? 0) + amount))
  }

  // 2. Créditos por ciclo, conforme due_date_ref. Pagamentos sem due_date_ref formam um
  //    pool "não vinculado" que entra antes do primeiro ciclo da linha do tempo.
  const paymentBuckets = new Map<string, number>()
  let unassigned = 0
  for (const payment of payments) {
    const amount = Number(payment.amount)
    if (isNaN(amount)) continue
    const ref = payment.due_date_ref ? toISOString(payment.due_date_ref) : ''
    if (ref) {
      paymentBuckets.set(ref, round2((paymentBuckets.get(ref) ?? 0) + amount))
    } else {
      unassigned = round2(unassigned + amount)
    }
  }

  // 3. União de todas as datas com débito e/ou crédito vinculado, em ordem cronológica
  const allDates = new Set<string>(Array.from(cycleTotals.keys()).concat(Array.from(paymentBuckets.keys())))
  const sortedDates = Array.from(allDates).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

  // 4. Caminhada cronológica: sobra/órfão/não-vinculado carrega para o próximo ciclo
  let carry = unassigned
  const allCycles: CycleBalance[] = []
  for (const due_date of sortedDates) {
    const owed = cycleTotals.get(due_date) ?? 0
    const available = round2((paymentBuckets.get(due_date) ?? 0) + carry)
    const applied = Math.min(available, owed)
    const remaining = round2(owed - applied)
    carry = round2(available - applied)

    const dueDate = new Date(due_date + 'T12:00:00')
    allCycles.push({
      due_date,
      total_orders: owed,
      remaining,
      is_overdue: remaining > 0 && dueDate < today,
      is_next_due: false,
    })
  }

  // Sobra final, sem nenhum ciclo futuro conhecido para absorver = adiantamento do cliente
  const customer_advance = round2(Math.max(carry, 0))

  const openCycles = allCycles.filter(c => c.remaining > 0)

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
    customer_advance,
    cycles: openCycles,
    all_cycles: allCycles,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
