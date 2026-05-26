'use client'

import { useState } from 'react'
import { Client } from '@/types'

export default function RelatoriosClient({ clients }: { clients: Client[] }) {
  const [pedidosClient, setPedidosClient] = useState('')
  const [pedidosStart, setPedidosStart] = useState('')
  const [pedidosEnd, setPedidosEnd] = useState('')

  const [extratoClient, setExtratoClient] = useState('')
  const [extratoDue, setExtratoDue] = useState('')

  function gerarPedidosPDF() {
    const params = new URLSearchParams()
    if (pedidosStart) params.set('start', pedidosStart)
    if (pedidosEnd) params.set('end', pedidosEnd)
    if (pedidosClient) params.set('client', pedidosClient)
    window.open(`/api/relatorios/pedidos/pdf?${params}`, '_blank')
  }

  function gerarExtratoPDF() {
    const params = new URLSearchParams()
    if (extratoDue) params.set('due_date', extratoDue)
    if (extratoClient) params.set('client', extratoClient)
    window.open(`/api/relatorios/extrato/pdf?${params}`, '_blank')
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
        <button onClick={gerarPedidosPDF} className="btn-primary w-full">📄 Gerar PDF</button>
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
        <button onClick={gerarExtratoPDF} className="btn-primary w-full">📄 Gerar PDF</button>
      </div>
    </div>
  )
}
