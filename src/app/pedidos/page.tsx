import { sql } from '@/lib/db'
import { formatCurrency, formatDateBR } from '@/lib/billing'
import NovoPedidoForm from './NovoPedidoForm'
import DeleteButton from './DeleteButton'

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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Descrição</th>
                <th className="px-6 py-3 font-medium">Vencimento</th>
                <th className="px-6 py-3 font-medium text-right">Valor</th>
                <th className="px-6 py-3 font-medium text-center">Origem</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(orders as any[]).map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-gray-700 whitespace-nowrap">{formatDateBR(o.order_date)}</td>
                  <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{o.description || '—'}</td>
                  <td className="px-6 py-3 text-gray-700 whitespace-nowrap">{formatDateBR(o.due_date)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(Number(o.total_amount))}</td>
                  <td className="px-6 py-3 text-center">
                    {o.imported
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">importado</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">manual</span>}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {!o.imported && <DeleteButton id={o.id} type="order" />}
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhum pedido registrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
