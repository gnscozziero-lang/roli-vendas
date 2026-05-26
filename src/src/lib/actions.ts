'use server';

import { sql } from './db';
import { revalidatePath } from 'next/cache';
import { getDueDate, formatDateISO } from './billing';

// Local helper — Neon returns Date objects; this normalizes to YYYY-MM-DD string
function toISO(val: any): string {
  if (!val) return '';
  if (val instanceof Date) return formatDateISO(val);
  return String(val).substring(0, 10);
}

// ─── CLIENTS ────────────────────────────────────────────────────────────────

export async function getClients() {
  const rows = await sql`SELECT * FROM clients ORDER BY name ASC` as any[];
  return rows;
}

export async function getActiveClients() {
  const rows = await sql`SELECT * FROM clients WHERE active = true ORDER BY name ASC` as any[];
  return rows;
}

export async function createClient(name: string) {
  await sql`INSERT INTO clients (name) VALUES (${name.trim().toUpperCase()})`;
  revalidatePath('/clientes');
}

export async function updateClient(id: string, name: string) {
  await sql`UPDATE clients SET name = ${name.trim().toUpperCase()} WHERE id = ${id}`;
  revalidatePath('/clientes');
}

export async function toggleClientActive(id: string, active: boolean) {
  await sql`UPDATE clients SET active = ${active} WHERE id = ${id}`;
  revalidatePath('/clientes');
}

// ─── ITEMS ───────────────────────────────────────────────────────────────────

export async function getItems() {
  const rows = await sql`SELECT * FROM items ORDER BY name ASC` as any[];
  return rows;
}

export async function createItem(name: string, unit_price: number) {
  await sql`INSERT INTO items (name, unit_price, active) VALUES (${name}, ${unit_price}, true)`;
  revalidatePath('/itens');
}

export async function updateItemPrice(id: string, unit_price: number) {
  await sql`UPDATE items SET unit_price = ${unit_price} WHERE id = ${id}`;
  revalidatePath('/itens');
  revalidatePath('/pedidos');
}

export async function toggleItemActive(id: string, active: boolean) {
  await sql`UPDATE items SET active = ${active} WHERE id = ${id}`;
  revalidatePath('/itens');
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export async function createOrder(formData: FormData) {
  const order_date = formData.get('order_date') as string;
  const description = formData.get('description') as string;
  const client = formData.get('client') as string;

  let due_date = formData.get('due_date') as string;
  if (!due_date) {
    due_date = formatDateISO(getDueDate(new Date(order_date + 'T12:00:00')));
  }

  const itemsJson = formData.get('items') as string;
  const items = JSON.parse(itemsJson) as {
    item_id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
  }[];

  const total_amount = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const result = await sql`
    INSERT INTO orders (order_date, due_date, total_amount, description, imported, client)
    VALUES (${order_date}, ${due_date}, ${total_amount}, ${description}, false, ${client})
    RETURNING id
  ` as any[];

  const order_id = result[0].id;

  for (const item of items) {
    await sql`
      INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price, total_price)
      VALUES (${order_id}, ${item.item_id}, ${item.item_name}, ${item.quantity}, ${item.unit_price}, ${item.quantity * item.unit_price})
    `;
  }

  revalidatePath('/pedidos');
  revalidatePath('/');
}

export async function updateOrder(
  id: string,
  order_date: string,
  due_date: string,
  description: string,
  client: string,
  items: { item_id: string; item_name: string; quantity: number; unit_price: number }[]
) {
  const total_amount = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  await sql`
    UPDATE orders
    SET order_date = ${order_date}, due_date = ${due_date}, total_amount = ${total_amount},
        description = ${description}, client = ${client}
    WHERE id = ${id}
  `;

  await sql`DELETE FROM order_items WHERE order_id = ${id}`;

  for (const item of items) {
    await sql`
      INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price, total_price)
      VALUES (${id}, ${item.item_id}, ${item.item_name}, ${item.quantity}, ${item.unit_price}, ${item.quantity * item.unit_price})
    `;
  }

  revalidatePath('/pedidos');
  revalidatePath('/');
}

export async function deleteOrder(id: string) {
  await sql`DELETE FROM order_items WHERE order_id = ${id}`;
  await sql`DELETE FROM orders WHERE id = ${id}`;
  revalidatePath('/pedidos');
  revalidatePath('/');
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

export async function createPayment(formData: FormData) {
  const payment_date = formData.get('payment_date') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const notes = formData.get('notes') as string;
  const due_date_ref = formData.get('due_date_ref') as string || null;
  const client = formData.get('client') as string;

  await sql`
    INSERT INTO payments (payment_date, amount, notes, imported, due_date_ref, client)
    VALUES (${payment_date}, ${amount}, ${notes}, false, ${due_date_ref}, ${client})
  `;

  revalidatePath('/pagamentos');
  revalidatePath('/');
}

export async function updatePayment(
  id: string,
  payment_date: string,
  amount: number,
  notes: string,
  due_date_ref: string | null,
  client: string
) {
  await sql`
    UPDATE payments
    SET payment_date = ${payment_date}, amount = ${amount}, notes = ${notes},
        due_date_ref = ${due_date_ref}, client = ${client}
    WHERE id = ${id}
  `;

  revalidatePath('/pagamentos');
  revalidatePath('/');
}

export async function deletePayment(id: string) {
  await sql`DELETE FROM payments WHERE id = ${id}`;
  revalidatePath('/pagamentos');
  revalidatePath('/');
}

// ─── IMPORT ──────────────────────────────────────────────────────────────────

export async function importData(data: {
  orders: any[];
  payments: any[];
  items: any[];
}) {
  for (const item of data.items) {
    await sql`
      INSERT INTO items (name, unit_price, active)
      VALUES (${item.name}, ${item.unit_price}, true)
      ON CONFLICT DO NOTHING
    `;
  }

  for (const order of data.orders) {
    const result = await sql`
      INSERT INTO orders (order_date, due_date, total_amount, description, imported, client)
      VALUES (${order.order_date}, ${order.due_date}, ${order.total_amount}, ${order.description}, true, 'RLENZ')
      RETURNING id
    ` as any[];

    const order_id = result[0].id;

    if (order.items) {
      for (const item of order.items) {
        await sql`
          INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price, total_price)
          VALUES (${order_id}, ${item.item_id}, ${item.item_name}, ${item.quantity}, ${item.unit_price}, ${item.total_price})
        `;
      }
    }
  }

  for (const payment of data.payments) {
    await sql`
      INSERT INTO payments (payment_date, amount, notes, imported, due_date_ref, client)
      VALUES (${payment.payment_date}, ${payment.amount}, ${payment.notes ?? ''}, true, ${payment.due_date_ref ?? null}, 'RLENZ')
    `;
  }

  revalidatePath('/');
  return { orders: data.orders.length, payments: data.payments.length, items: data.items.length };
}

// ─── ALIASES — compatibilidade com código existente ──────────────────────────
export const addItem = createItem;
export const updateItem = updateItemPrice;

// runImport aceita string JSON (vindo do ImportForm) ou objeto
export async function runImport(input: string | { orders: any[]; payments: any[]; items: any[] }) {
  const data = typeof input === 'string' ? JSON.parse(input) : input;
  const result = await importData(data);
  return result;
}
