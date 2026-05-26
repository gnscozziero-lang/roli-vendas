import { getClients } from '@/lib/actions';
import ClientesTable from './ClientesTable';

export default async function ClientesPage() {
  const clients = await getClients() as any[];
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>
      <ClientesTable clients={clients} />
    </div>
  );
}
