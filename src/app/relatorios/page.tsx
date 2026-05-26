import { getActiveClients } from '@/lib/actions';
import RelatoriosClient from './RelatoriosClient';

export default async function RelatoriosPage() {
  const clients = await getActiveClients() as any[];
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>
      <RelatoriosClient clients={clients} />
    </div>
  );
}
