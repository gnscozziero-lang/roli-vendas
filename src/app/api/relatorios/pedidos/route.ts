import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'Parâmetros from e to obrigatórios.' }, { status: 400 })
  }

  try {
    // Busca pedidos no período
    const orders = await sql`
      SELECT id, order_date, due_date, total_amount, description
      FROM orders
      WHERE order_date BETWEEN ${from} AND ${to}
      ORDER BY order_date ASC
    `

    // Busca itens de cada pedido
    const orderIds = (orders as any[]).map((o: any) => o.id)

    let items: any[] = []
    if (orderIds.length > 0) {
      items = await sql`
        SELECT order_id, item_name, quantity, unit_price, total_price
        FROM order_items
        WHERE order_id = ANY(${orderIds}::uuid[])
        ORDER BY order_id, item_name
      ` as any[]
    }

    // Agrupa itens por pedido
    const itemsByOrder: Record<string, any[]> = {}
    for (const item of items) {
      const oid = item.order_id
      if (!itemsByOrder[oid]) itemsByOrder[oid] = []
      itemsByOrder[oid].push(item)
    }

    // Junta pedidos com seus itens
    const result = (orders as any[]).map((o: any) => ({
      ...o,
      items: itemsByOrder[o.id] ?? [],
    }))

    return NextResponse.json({ orders: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
