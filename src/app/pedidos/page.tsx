import { sql } from '@/lib/db';
import { toISO } from '@/lib/billing';
import NovoPedidoForm from './NovoPedidoForm';
import PedidosTable from './PedidosTable';
import { getActiveClients } from '@/lib/actions';

export default async function PedidosPage() {
  const itemRows = await sql`SELECT * FROM items WHERE active = true ORDER BY name ASC` as any[];
  const items = itemRows.map((r: any) => ({ ...r, order_date: r.order_date ? toISO(r.order_date) : undefined }));

  const orderRows = await sql`
    SELECT * FROM orders ORDER BY order_date DESC, id DESC
  ` as any[];
  const orders = orderRows.map((r: any) => ({
    ...r,
    order_date: toISO(r.order_date),
    due_date: toISO(r.due_date),
  }));

  const clients = await getActiveClients() as any[];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <NovoPedidoForm items={items} clients={clients} />
      <PedidosTable orders={orders} items={items} clients={clients} />
    </div>
  );
}
