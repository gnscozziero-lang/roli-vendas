import { sql } from '@/lib/db';
import { formatDateISO } from '@/lib/billing';
import PrintButton from './PrintButton';
import { getActiveClients } from '@/lib/actions';
import DashboardClient from './DashboardClient';

function toISO(val: any): string {
  if (!val) return '';
  if (val instanceof Date) return formatDateISO(val);
  return String(val).substring(0, 10);
}

export default async function DashboardPage() {
  const clients = await getActiveClients() as any[];

  const orderRows = await sql`SELECT * FROM orders ORDER BY due_date ASC, id ASC` as any[];
  const orders = orderRows.map((r: any) => ({
    ...r,
    order_date: toISO(r.order_date),
    due_date: toISO(r.due_date),
    total_amount: Number(r.total_amount),
  }));

  const paymentRows = await sql`SELECT * FROM payments ORDER BY payment_date ASC, id ASC` as any[];
  const payments = paymentRows.map((r: any) => ({
    ...r,
    amount: Number(r.amount),
    payment_date: toISO(r.payment_date),
    due_date_ref: r.due_date_ref ? toISO(r.due_date_ref) : null,
  }));

  const settingRows = await sql`SELECT value FROM settings WHERE key = 'initial_balance'` as any[];
  const initialBalance = settingRows.length > 0 ? Number(settingRows[0].value) : 0;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <PrintButton />
      </div>
      <DashboardClient orders={orders} payments={payments} clients={clients} initialBalance={initialBalance} />
    </div>
  );
}
