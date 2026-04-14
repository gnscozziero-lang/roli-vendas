import { sql } from '@/lib/db'
import ItemsTable from './ItemsTable'

export const revalidate = 0

export default async function ItensPage() {
  const items = await sql`SELECT * FROM items ORDER BY name`
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Itens</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie preços e itens disponíveis para pedidos</p>
      </div>
      <div className="card overflow-hidden">
        <ItemsTable items={items as any[]} />
      </div>
    </div>
  )
}