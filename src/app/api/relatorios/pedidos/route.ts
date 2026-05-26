import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { formatDateISO } from '@/lib/billing';

function toISO(val: any): string {
  if (!val) return '';
  if (val instanceof Date) return formatDateISO(val);
  return String(val).substring(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const client = searchParams.get('client');

  let orderRows: any[];

  if (start && end && client) {
    orderRows = await sql`SELECT * FROM orders WHERE order_date BETWEEN ${start} AND ${end} AND client = ${client} ORDER BY order_date ASC, id ASC` as any[];
  } else if (start && end) {
    orderRows = await sql`SELECT * FROM orders WHERE order_date BETWEEN ${start} AND ${end} ORDER BY order_date ASC, id ASC` as any[];
  } else if (client) {
    orderRows = await sql`SELECT * FROM orders WHERE client = ${client} ORDER BY order_date ASC, id ASC` as any[];
  } else {
    orderRows = await sql`SELECT * FROM orders ORDER BY order_date ASC, id ASC` as any[];
  }

  const orders = await Promise.all(
    orderRows.map(async (o: any) => {
      const items = await sql`SELECT * FROM order_items WHERE order_id = ${o.id}` as any[];
      return { ...o, order_date: toISO(o.order_date), due_date: toISO(o.due_date), items };
    })
  );

  const total = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  return NextResponse.json({ orders, total });
}
