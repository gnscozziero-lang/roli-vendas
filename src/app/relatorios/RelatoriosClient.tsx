'use client';

import { useState } from 'react';
import { Client } from '@/types';

interface Props {
  clients: Client[];
}

export default function RelatoriosClient({ clients }: Props) {
  // ─── Relatório analítico ──────────────────────────────────────────────────
  const [pedidosClient, setPedidosClient] = useState('');
  const [pedidosStart, setPedidosStart] = useState('');
  const [pedidosEnd, setPedidosEnd] = useState('');
  const [pedidosData, setPedidosData] = useState<any>(null);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  // ─── Extrato por vencimento ───────────────────────────────────────────────
  const [extratoClient, setExtratoClient] = useState('');
  const [extratoDue, setExtratoDue] = useState('');
  const [extratoData, setExtratoData] = useState<any>(null);
  const [loadingExtrato, setLoadingExtrato] = useState(false);

  async function fetchPedidos() {
    setLoadingPedidos(true);
    const params = new URLSearchParams();
    if (pedidosStart) params.set('start', pedidosStart);
    if (pedidosEnd) params.set('end', pedidosEnd);
    if (pedidosClient) params.set('client', pedidosClient);
    const res = await fetch(`/api/relatorios/pedidos?${params}`);
    const data = await res.json();
    setPedidosData(data);
    setLoadingPedidos(false);
  }

  async function fetchExtrato() {
    setLoadingExtrato(true);
    const params = new URLSearchParams();
    if (extratoDue) params.set('due_date', extratoDue);
    if (extratoClient) params.set('client', extratoClient);
    const res = await fetch(`/api/relatorios/extrato?${params}`);
    const data = await res.json();
    setExtratoData(data);
    setLoadingExtrato(false);
  }

  function printSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Relatório</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;padding:24px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
      th{background:#f0f0f0}</style></head>
      <body>${el.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="space-y-10">

      {/* ── Relatório Analítico ─────────────────────────────────────────────── */}
      <section className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Relatório Analítico de Pedidos</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <select
              value={pedidosClient}
              onChange={e => setPedidosClient(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Todos</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div /> {/* spacer */}
          <div>
            <label className="block text-sm font-medium mb-1">Data inicial</label>
            <input type="date" value={pedidosStart} onChange={e => setPedidosStart(e.target.value)}
              className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data final</label>
            <input type="date" value={pedidosEnd} onChange={e => setPedidosEnd(e.target.value)}
              className="border rounded px-3 py-2 w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPedidos} disabled={loadingPedidos}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loadingPedidos ? 'Carregando...' : 'Gerar'}
          </button>
          {pedidosData && (
            <button onClick={() => printSection('print-pedidos')}
              className="border px-4 py-2 rounded hover:bg-gray-50">
              Imprimir
            </button>
          )}
        </div>

        {pedidosData && (
          <div id="print-pedidos" className="mt-6">
            <p className="text-sm text-gray-500 mb-3">
              {pedidosClient ? `Cliente: ${pedidosClient}` : 'Todos os clientes'} &nbsp;|&nbsp;
              {pedidosStart || '—'} a {pedidosEnd || '—'} &nbsp;|&nbsp;
              Total: <strong>R$ {pedidosData.total?.toFixed(2)}</strong>
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">Data</th>
                  <th className="border px-3 py-2 text-left">Cliente</th>
                  <th className="border px-3 py-2 text-left">Vencimento</th>
                  <th className="border px-3 py-2 text-left">Descrição</th>
                  <th className="border px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {pedidosData.orders?.map((o: any) => (
                  <>
                    <tr key={o.id} className="border-t font-medium">
                      <td className="border px-3 py-1">{o.order_date}</td>
                      <td className="border px-3 py-1">{o.client}</td>
                      <td className="border px-3 py-1">{o.due_date}</td>
                      <td className="border px-3 py-1">{o.description || '—'}</td>
                      <td className="border px-3 py-1 text-right">R$ {Number(o.total_amount).toFixed(2)}</td>
                    </tr>
                    {o.items?.map((item: any) => (
                      <tr key={item.id} className="bg-gray-50 text-xs text-gray-600">
                        <td className="border px-3 py-1" colSpan={3}></td>
                        <td className="border px-3 py-1 pl-6">↳ {item.item_name} × {item.quantity}</td>
                        <td className="border px-3 py-1 text-right">R$ {Number(item.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Extrato por Vencimento ──────────────────────────────────────────── */}
      <section className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Extrato por Vencimento</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <select
              value={extratoClient}
              onChange={e => setExtratoClient(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">Todos</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vencimento</label>
            <input type="date" value={extratoDue} onChange={e => setExtratoDue(e.target.value)}
              className="border rounded px-3 py-2 w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchExtrato} disabled={loadingExtrato}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loadingExtrato ? 'Carregando...' : 'Gerar'}
          </button>
          {extratoData && (
            <button onClick={() => printSection('print-extrato')}
              className="border px-4 py-2 rounded hover:bg-gray-50">
              Imprimir
            </button>
          )}
        </div>

        {extratoData && (
          <div id="print-extrato" className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="border rounded p-3">
                <p className="text-xs text-gray-500">Saldo Atrasado</p>
                <p className="text-lg font-bold text-red-600">R$ {extratoData.overdue?.toFixed(2)}</p>
              </div>
              <div className="border rounded p-3">
                <p className="text-xs text-gray-500">A Vencer ({extratoData.due_date})</p>
                <p className="text-lg font-bold text-blue-600">R$ {extratoData.upcoming?.toFixed(2)}</p>
              </div>
              <div className="border rounded p-3">
                <p className="text-xs text-gray-500">Total Devedor</p>
                <p className="text-lg font-bold">R$ {extratoData.total_open?.toFixed(2)}</p>
              </div>
            </div>

            <h3 className="font-medium">Pedidos do ciclo</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">Data</th>
                  <th className="border px-3 py-2 text-left">Cliente</th>
                  <th className="border px-3 py-2 text-left">Descrição</th>
                  <th className="border px-3 py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {extratoData.orders?.map((o: any) => (
                  <tr key={o.id} className="border-t">
                    <td className="border px-3 py-1">{o.order_date}</td>
                    <td className="border px-3 py-1">{o.client}</td>
                    <td className="border px-3 py-1">{o.description || '—'}</td>
                    <td className="border px-3 py-1 text-right">R$ {Number(o.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="font-medium">Pagamentos do ciclo</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">Data</th>
                  <th className="border px-3 py-2 text-left">Cliente</th>
                  <th className="border px-3 py-2 text-left">Obs</th>
                  <th className="border px-3 py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {extratoData.payments?.map((p: any) => (
                  <tr key={p.id} className="border-t">
                    <td className="border px-3 py-1">{p.payment_date}</td>
                    <td className="border px-3 py-1">{p.client}</td>
                    <td className="border px-3 py-1">{p.notes || '—'}</td>
                    <td className="border px-3 py-1 text-right text-green-700">R$ {Number(p.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
