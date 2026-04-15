import { sql } from '@/lib/db'
import { formatDateBR } from '@/lib/billing'
import RelatoriosClient from './RelatoriosClient'

export const revalidate = 0

export default async function RelatoriosPage() {
  // Busca todos os ciclos (due_dates) disponíveis para o relatório de vencimento
  const ciclos = await sql`
    SELECT DISTINCT due_date
    FROM orders
    ORDER BY due_date DESC
  `

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-1">Gere relatórios em PDF de pedidos e extratos por vencimento</p>
      </div>
      <RelatoriosClient ciclos={(ciclos as any[]).map((c: any) => ({
        due_date: typeof c.due_date === 'string' ? c.due_date.substring(0, 10) : c.due_date.toISOString().substring(0, 10)
      }))} />
    </div>
  )
}
