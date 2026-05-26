'use client'

import { useState } from 'react'
import { Client } from '@/types'
import { formatCurrency, formatDateBR } from '@/lib/billing'

export default function RelatoriosClient({ clients }: { clients: Client[] }) {
  const [pedidosClient, setPedidosClient] = useState('')
  const [pedidosStart, setPedidosStart] = useState('')
  const [pedidosEnd, setPedidosEnd] = useState('')
  const [pedidosData, setPedidosData] = useState<any>(null)
  const [loadingPedidos, setLoadingPedidos] = useState(false)

  const [extratoClient, setExtratoClient] = useState('')
  const [extratoDue, setExtratoDue] = useState('')
  const [extratoData, setExtratoData] = useState<any>(null)
  const [loadingExtrato, setLoadingExtrato] = useState(false)

  async function gerarPedidos() {
    setLoadingPedidos(true)
    const params = new URLSearchParams()
    if (pedidosStart) params.set('start', pedidosStart)
    if (pedidosEnd) params.set('end', pedidosEnd)
    if (pedidosClient) params.set('client', pedidosClient)
    const res = await fetch(`/api/relatorios/pedidos?${params}`)
    const data = await res.json()
    setPedidosData(data)
    setLoadingPedidos(false)
  }

  async function gerarExtrato() {
    setLoadingExtrato(true)
    const params = new URLSearchParams()
    if (extratoDue) params.set('due_date', extratoDue)
    if (extratoClient) params.set('client', extratoClient)
    const res = await fetch(`/api/relatorios/extrato?${params}`)
    const data = await res.json()
    setExtratoData(data)
    setLoadingExtrato(false)
  }

  function imprimir(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Relatório</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; color: #111; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        h2 { font-size: 13px; margin: 16px 0 8px; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #1a5c38; color: white; padding: 6px 10px; text-align: left; font-size: 11px; }
        td { padding: 5px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
        .sub td { background: #f9fafb; color: #666; padding-left: 24px; }
        .total td { font-weight: bold; background: #f0fdf4; }
        .red { color: #dc2626; font-weight: bold; }
        .green { color: #15803d; font-weight: bold; }
        .right { text-align: right; }
        .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: right; }
      </style></head><body>${el.innerHTML}
      <div class="footer">Emitido em ${new Date().toLocaleString('pt-BR')}</div>
      </body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

      {/* Relatório de Pedidos */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800">Relatório de Pedidos</h2>
          <p className="text-sm text-gray-500 mt-1">Analítico — detalha cada pedido com seus itens</p>
        </div>
        <div>
          <label className="label">Cliente</label>
          <select value={pedidosClient} onChange={e => setPedidosClient(e.target.value)} className="input">
            <option value="">Todos os clientes</option>
            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Data inicial</label>
            <input type="date" value={pedidosStart} onChange={e => setPedidosStart(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Data final</label>
            <input type="date" value={pedidosEnd} onChange={e => setPedidosEnd(e.target.value)} className="input" />
          </div>
        </div>
        <p className="text-xs text-gray-400">Pedidos importados sem itens detalhados aparecem com o valor total.</p>
        <div className="flex gap-2">
          <button onClick={gerarPedidos} disabled={loadingPedidos} className="btn-primary flex-1">
            {loadingPedidos ? 'Carregando…' : '📄 Gerar'}
          </button>
          {pedidosData && (
            <button onClick={() => imprimir('print-pedidos')} className="btn-secondary">🖨️ Imprimir</button>
          )}
        </div>

        {pedidosData && (
          <div id="print-pedidos" className="mt-2">
            <h1>Relatório de Pedidos</h1>
            <p style={{fontSize: '11px', color: '#555', marginBottom: '8px'}}>
              {pedidosClient || 'Todos os clientes'} · {pedidosStart || '—'} a {pedidosEnd || '—'} · Total: {formatCurrency(pedidosData.total ?? 0)}
            </p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="bg-green-800 text-white px-3 py-2 text-left">Data</th>
                  <th className="bg-green-800 text-white px-3 py-2 text-left">Cliente</th>
                  <th className="bg-green-800 text-white px-3 py-2 text-left">Descrição</th>
                  <th className="bg-green-800 text-white px-3 py-2 text-left">Vencimento</th>
                  <th className="bg-green-800 text-white px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(pedidosData.orders ?? []).map((o: any) => (
                  <>
                    <tr key={o.id} className="border-b">
                      <td className="px-3 py-1">{formatDateBR(o.order_date)}</td>
                      <td className="px-3 py-1 font-medium">{o.client}</td>
                      <td className="px-3 py-1">{o.description || '—'}</td>
                      <td className="px-3 py-1">{formatDateBR(o.due_date)}</td>
                      <td className="px-3 py-1 text-right font-semibold">{formatCurrency(Number(o.total_amount))}</td>
                    </tr>
                    {(o.items ?? []).map((item: any) => (
                      <tr key={item.id} className="bg-gray-50 text-gray-500">
                        <td className="px-3 py-0.5" colSpan={3}></td>
                        <td className="px-3 py-0.5 pl-8">↳ {item.item_name} × {item.quantity}</td>
                        <td className="px-3 py-0.5 text-right">{formatCurrency(Number(item.total_price))}</td>
                      </tr>
                    ))}
                  </>
                ))}
                <tr className="bg-green-50 font-bold">
                  <td colSpan={4} className="px-3 py-2">TOTAL DO PERÍODO</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(pedidosData.total ?? 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Extrato por Vencimento */}
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800">Extrato por Vencimento</h2>
          <p className="text-sm text-gray-500 mt-1">Sintético — pedidos e pagamentos do ciclo, estilo conta corrente</p>
        </div>
        <div>
          <label className="label">Cliente</label>
          <select value={extratoClient} onChange={e => setExtratoClient(e.target.value)} className="input">
            <option value="">Todos os clientes</option>
            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Vencimento</label>
          <input type="date" value={extratoDue} onChange={e => setExtratoDue(e.target.value)} className="input" />
        </div>
        <p className="text-xs text-gray-400">Pagamentos são abatidos do ciclo mais antigo primeiro.</p>
        <div className="flex gap-2">
          <button onClick={gerarExtrato} disabled={loadingExtrato} className="btn-primary flex-1">
            {loadingExtrato ? 'Carregando…' : '📄 Gerar'}
          </button>
          {extratoData && (
            <button onClick={() => imprimir('print-extrato')} className="btn-secondary">🖨️ Imprimir</button>
          )}
        </div>

        {extratoData && (
          <div id="print-extrato" className="mt-2 space-y-4">
            <h1>Extrato — Vencimento {formatDateBR(extratoData.due_date)}</h1>
            {extratoData.overdue > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase mb-1">Saldo em Atraso</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(extratoData.overdue)}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase mb-1">Saldo a Vencer</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(extratoData.upcoming ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Pedidos do Ciclo</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="bg-green-800 text-white px-3 py-1.5 text-left">Data</th>
                    <th className="bg-green-800 text-white px-3 py-1.5 text-left">Cliente</th>
                    <th className="bg-green-800 text-white px-3 py-1.5 text-left">Descrição</th>
                    <th className="bg-green-800 text-white px-3 py-1.5 text-right">Débito</th>
                  </tr>
                </thead>
                <tbody>
                  {(extratoData.orders ?? []).map((o: any) => (
                    <tr key={o.id} className="border-b">
                      <td className="px-3 py-1">{formatDateBR(o.order_date)}</td>
                      <td className="px-3 py-1">{o.client}</td>
                      <td className="px-3 py-1">{o.description || '—'}</td>
                      <td className="px-3 py-1 text-right">{formatCurrency(Number(o.total_amount))}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3} className="px-3 py-1">Subtotal Pedidos</td>
                    <td className="px-3 py-1 text-right">{formatCurrency((extratoData.orders ?? []).reduce((s: number, o: any) => s + Number(o.total_amount), 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase mb-2">Pagamentos Recebidos</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="bg-green-800 text-white px-3 py-1.5 text-left">Data</th>
                    <th className="bg-green-800 text-white px-3 py-1.5 text-left">Cliente</th>
                    <th className="bg-green-800 text-white px-3 py-1.5 text-left">Obs</th>
                    <th className="bg-green-800 text-white px-3 py-1.5 text-right">Crédito</th>
                  </tr>
                </thead>
                <tbody>
                  {(extratoData.payments ?? []).map((p: any) => (
                    <tr key={p.id} className="border-b">
                      <td className="px-3 py-1">{formatDateBR(p.payment_date)}</td>
                      <td className="px-3 py-1">{p.client}</td>
                      <td className="px-3 py-1">{p.notes || '—'}</td>
                      <td className="px-3 py-1 text-right text-green-700 font-semibold">{formatCurrency(Number(p.amount))}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3} className="px-3 py-1">Subtotal Pagamentos</td>
                    <td className="px-3 py-1 text-right text-green-700">{formatCurrency((extratoData.payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="pt-2 border-t-2 border-gray-300">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-700">Saldo em aberto:</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(extratoData.total_open ?? 0)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
