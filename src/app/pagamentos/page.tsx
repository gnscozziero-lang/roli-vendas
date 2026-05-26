import { sql } from '@/lib/db';
import { toISO } from '@/lib/billing';
import NovoPagamentoForm from './NovoPagamentoForm';
import PagamentosTable from './PagamentosTable';
import { getActiveClients } from '@/lib/actions';

export default async function PagamentosPage() {
  const paymentRows = await sql`
    SELECT * FROM payments ORDER BY payment_date DESC, id DESC
  ` as any[];
  const payments = paymentRows.map((r: any) => ({
    ...r,
    payment_date: toISO(r.payment_date),
    due_date_ref: r.due_date_ref ? toISO(r.due_date_ref) : null,
  }));

  const clients = await getActiveClients() as any[];

  // Unique due_dates from orders for the reference dropdown
  const dueDateRows = await sql`
    SELECT DISTINCT due_date FROM orders ORDER BY due_date DESC
  ` as any[];
  const dueDateOptions = dueDateRows.map((r: any) => toISO(r.due_date));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold">Pagamentos</h1>
      <NovoPagamentoForm clients={clients} dueDateOptions={dueDateOptions} />
      <PagamentosTable payments={payments} clients={clients} />
    </div>
  );
}
