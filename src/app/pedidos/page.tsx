import { sql } from '@/lib/db'
import NovoPedidoForm from './NovoPedidoForm'
import PedidosTable from './PedidosTable'

export const revalidate = 0

export default async function PedidosPage() {
  const [orders, items] = await Promise.all([
    sql`SELECT id, order_date, due_date, total_amount, description, imported FROM orders ORDER BY order_date DESC`,
    sql`SELECT * FROM items WHERE active = true ORDER BY name`,
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500 mt-1">Registre novos pedidos e consulte o histórico</p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-5">Novo Pedido</h2>
        <NovoPedidoForm items={items as any[]} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Histórico de Pedidos
            <span className="ml-2 text-sm font-normal text-gray-400">({orders.length} registros)</span>
          </h2>
        </div>
        <PedidosTable orders={orders as any[]} items={items as any[]} />
      </div>
    </div>
  )
}
