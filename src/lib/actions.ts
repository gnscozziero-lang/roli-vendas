'use server'

import { revalidatePath } from 'next/cache'
import { sql } from '@/lib/db'
import { getDueDateFromString } from '@/lib/billing'

// ── Items ──────────────────────────────────────────────────────────────────

export async function updateItemPrice(id: string, unit_price: number) {
  await sql`
    UPDATE items
    SET unit_price = ${unit_price}, updated_at = NOW()
    WHERE id = ${id}
  `
  revalidatePath('/itens')
  revalidatePath('/pedidos')
}

export async function addItem(name: string, unit_price: number) {
  await sql`INSERT INTO items (name, unit_price) VALUES (${name}, ${unit_price})`
  revalidatePath('/itens')
  revalidatePath('/pedidos')
}

export async function toggleItemActive(id: string, active: boolean) {
  await sql`UPDATE items SET active = ${active} WHERE id = ${id}`
  revalidatePath('/itens')
  revalidatePath('/pedidos')
}

// ── Orders ─────────────────────────────────────────────────────────────────

export interface OrderLineInput {
  item_id: string | null
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export async function createOrder(
  order_date: string,
  description: string,
  lines: OrderLineInput[]
) {
  if (!lines.length) throw new Error('Pedido vazio')

  const total_amount = lines.reduce((s, l) => s + l.total_price, 0)
  const due_date     = getDueDateFromString(order_date)

  const rows = await sql`
    INSERT INTO orders (order_date, due_date, total_amount, description)
    VALUES (${order_date}, ${due_date}, ${total_amount}, ${description})
    RETURNING id
  `
  const orderId = rows[0].id

  for (const line of lines) {
    await sql`
      INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price, total_price)
      VALUES (${orderId}, ${line.item_id}, ${line.item_name}, ${line.quantity}, ${line.unit_price}, ${line.total_price})
    `
  }

  revalidatePath('/')
  revalidatePath('/pedidos')
}

export async function deleteOrder(id: string) {
  await sql`DELETE FROM orders WHERE id = ${id}`
  revalidatePath('/')
  revalidatePath('/pedidos')
}

// ── Payments ───────────────────────────────────────────────────────────────

export async function createPayment(payment_date: string, amount: number, notes: string) {
  if (amount <= 0) throw new Error('Valor inválido')
  await sql`INSERT INTO payments (payment_date, amount, notes) VALUES (${payment_date}, ${amount}, ${notes})`
  revalidatePath('/')
  revalidatePath('/pagamentos')
}

export async function deletePayment(id: string) {
  await sql`DELETE FROM payments WHERE id = ${id}`
  revalidatePath('/')
  revalidatePath('/pagamentos')
}

// ── Import ─────────────────────────────────────────────────────────────────

export async function runImport(seedJson: string) {
  const seed = JSON.parse(seedJson)

  for (const item of seed.items) {
    await sql`
      INSERT INTO items (name, unit_price)
      VALUES (${item.name}, ${item.unit_price})
      ON CONFLICT (name) DO UPDATE SET unit_price = EXCLUDED.unit_price, updated_at = NOW()
    `
  }

  await sql`
    INSERT INTO settings (key, value) VALUES ('initial_balance', ${String(seed.initial_balance)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `

  for (const o of seed.orders) {
    const due = getDueDateFromString(o.date)
    await sql`
      INSERT INTO orders (order_date, due_date, total_amount, description, imported)
      VALUES (${o.date}, ${due}, ${o.amount}, ${o.description ?? ''}, true)
    `
  }

  for (const p of seed.payments) {
    await sql`
      INSERT INTO payments (payment_date, amount, notes, imported)
      VALUES (${p.date}, ${p.amount}, ${'importado'}, true)
    `
  }

  revalidatePath('/')
  revalidatePath('/pedidos')
  revalidatePath('/pagamentos')
  return { items: seed.items.length, orders: seed.orders.length, payments: seed.payments.length }
}
