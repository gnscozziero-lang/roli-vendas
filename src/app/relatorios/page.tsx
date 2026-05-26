import { getActiveClients } from '@/lib/actions'
import RelatoriosClient from './RelatoriosClient'

export default async function RelatoriosPage() {
  const clients = await getActiveClients() as any[]
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-1">Gere PDFs analíticos e extratos por vencimento</p>
      </div>
      <RelatoriosClient clients={clients} />
    </div>
  )
}
