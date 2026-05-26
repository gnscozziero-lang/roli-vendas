import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { calculateBalances, toISO } from '@/lib/billing';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const due_date = searchParams.get('due_date');
  const client = searchParams.get('client');

  // Fetch all orders and payments, optionally filtered by client
  let allOrderRows: any[];
  let allPaymentRows: any[];

  if (client) {
    allOrderRows = await sql`
      SELECT * FROM orders WHERE client = ${client} ORDER BY due_date ASC, id ASC
    ` as any[];
    allPaymentRows = await sql`
      SELECT * FROM payments WHERE client = ${client} ORDER BY payment_date ASC, id ASC
    ` as any[];
  } else {
    allOrderRows = await sql`SELECT * FROM orders ORDER BY due_date ASC, id ASC` as any[];
    allPaymentRows = await sql`SELECT * FROM payments ORDER BY payment_date ASC, id ASC` as any[];
  }

  const allOrders = allOrderRows.map((r: any) => ({
    ...r,
    order_date: toISO(r.order_date),
    due_date: toISO(r.due_date),
  }));

  const allPayments = allPaymentRows.map((r: any) => ({
    ...r,
    payment_date: toISO(r.payment_date),
    due_date_ref: r.due_date_ref ? toISO(r.due_date_ref) : null,
  }));

  // Run calculateBalances to get the same numbers as dashboard
  const { cycles, totalOpen, overdue } = calculateBalances(allOrders, allPayments);

  // Find the specific cycle requested (or last open cycle)
  const targetDue = due_date || cycles.find((c: any) => c.balance > 0)?.due_date;

  const cycleOrders = targetDue
    ? allOrders.filter(o => o.due_date === targetDue)
    : [];

  const cyclePayments = targetDue
    ? allPayments.filter(p => {
        if (p.due_date_ref) return p.due_date_ref === targetDue;
        // fallback: payments within the cycle window
        const d = new Date(targetDue);
        const cycleStart = new Date(d);
        cycleStart.setDate(1);
        return p.payment_date >= toISO(cycleStart) && p.payment_date <= targetDue;
      })
    : [];

  const cycle = targetDue ? cycles.find((c: any) => c.due_date === targetDue) : null;

  return NextResponse.json({
    due_date: targetDue,
    overdue,
    upcoming: cycle?.balance ?? 0,
    total_open: totalOpen,
    orders: cycleOrders,
    payments: cyclePayments,
    cycles,
  });
}
