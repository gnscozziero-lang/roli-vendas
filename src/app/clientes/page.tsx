import { getClients } from '@/lib/actions'
import ClientesTable from './ClientesTable'

export default async function ClientesPage() {
  const clients = await getClients() as any[]
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-500 mt-1">Cadastre e gerencie os clientes do sistema</p>
      </div>
      <div className="card overflow-hidden">
        <ClientesTable clients={clients} />
      </div>
    </div>
  )
}
