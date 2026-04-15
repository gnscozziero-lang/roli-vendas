import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const due_date = searchParams.get('due_date')

  if (!due_date) {
    return NextResponse.json({ error: 'Parâmetro due_date obrigatório.' }, { status: 400 })
  }

  try {
    // Pedidos do ciclo
    const orders = await sql`
      SELECT id, order_date, due_date, total_amount, description
      FROM orders
      WHERE due_date = ${due_date}
      ORDER BY order_date ASC
    `

    // Pagamentos: buscamos todos os pagamentos e aplicamos ao ciclo
    // Para o extrato, mostramos os pagamentos que ocorreram no mesmo
    // período (entre o vencimento anterior e este vencimento)
    // Simplificado: todos os pagamentos feitos até a data de vencimento
    // que ainda não foram "consumidos" por ciclos anteriores.
    // Na prática, mostramos os pagamentos realizados no período do ciclo.
    const payments = await sql`
      SELECT id, payment_date, amount, notes
      FROM payments
      WHERE payment_date <= ${due_date}
      ORDER BY payment_date ASC
    `

    return NextResponse.json({ orders, payments })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
