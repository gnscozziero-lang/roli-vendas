'use client'

import { useState } from 'react'
import { formatCurrency, formatDateBR } from '@/lib/billing'

interface Ciclo { due_date: string }
interface Props { ciclos: Ciclo[] }

function toISO(val: unknown): string {
  if (!val) return ''
  if (val instanceof Date) return val.toISOString().substring(0, 10)
  return String(val).substring(0, 10)
}

function fmtDate(val: unknown) { return formatDateBR(toISO(val)) }
function fmtCur(val: unknown)  { return formatCurrency(Number(val)) }

function emitirPDF(html: string, titulo: string) {
  const win = window.open('', '_blank')
  if (!win) { alert('Permita pop-ups para gerar o PDF.'); return }
  win.document.write(`
    <!DOCTYPE html><html lang="pt-BR">
    <head>
      <meta charset="UTF-8"/>
      <title>${titulo}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
        header { border-bottom: 2px solid #15803d; padding-bottom: 10px; margin-bottom: 16px; }
        header h1 { font-size: 16px; color: #15803d; }
        header p  { font-size: 10px; color: #555; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #f0fdf4; color: #15803d; text-align: left; padding: 6px 8px; font-size: 10px; border-bottom: 2px solid #15803d; }
        td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
        .right { text-align: right; }
        .total-row td { font-weight: bold; background: #f0fdf4; border-top: 2px solid #15803d; }
        .section-title td { font-weight: bold; background: #e5e7eb; color: #374151; padding: 5px 8px; font-size: 10px; }
        .item-row td { color: #555; font-size: 10px; padding-left: 24px; }
        .pgto td { color: #15803d; }
        .sem-item td { color: #9ca3af; font-style: italic; padding-left: 24px; font-size: 10px; }
        .saldo-final { margin-top: 16px; text-align: right; font-size: 13px; font-weight: bold; }
        .saldo-final span { color: #dc2626; }
        footer { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 9px; color: #9ca3af; text-align: right; }
        @media print { body { padding: 12px; } }
      </style>
    </head>
    <body>
      ${html}
      <footer>Emitido em ${new Date().toLocaleString('pt-BR')}</footer>
      <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `)
  win.document.close()
}

// ── Relatório 1: Pedidos por Período (analítico) ──────────────────────────

function buildHTMLPedidos(orders: any[], dateFrom: string, dateTo: string): string {
  if (!orders.length) return '<p style="color:#555;margin-top:16px">Nenhum pedido encontrado no período.</p>'

  const total = orders.reduce((s: number, o: any) => s + Number(o.total_amount), 0)

  const rows = orders.map((o: any) => {
    const items = (o.items ?? []) as any[]

    const pedidoRow = `
      <tr>
        <td><strong>${fmtDate(o.order_date)}</strong></td>
        <td>${fmtDate(o.due_date)}</td>
        <td><strong>${o.description || '—'}</strong></td>
        <td></td><td></td>
        <td class="right"><strong>${fmtCur(o.total_amount)}</strong></td>
      </tr>`

    const itemRows = items.length > 0
      ? items.map((i: any) => `
          <tr class="item-row">
            <td></td>
            <td></td>
            <td style="padding-left:20px">${i.item_name}</td>
            <td class="right">${Number(i.quantity)}</td>
            <td class="right">${fmtCur(i.unit_price)}</td>
            <td class="right">${fmtCur(i.total_price)}</td>
          </tr>`).join('')
      : `<tr class="sem-item"><td colspan="6" style="padding-left:20px">Itens não detalhados (pedido importado)</td></tr>`

    return pedidoRow + itemRows
  }).join('')

  return `
    <header>
      <h1>Relatório de Pedidos — Analítico</h1>
      <p>Período: ${formatDateBR(dateFrom)} a ${formatDateBR(dateTo)}</p>
    </header>
    <table>
      <thead>
        <tr>
          <th>Data Pedido</th>
          <th>Vencimento</th>
          <th>Descrição / Item</th>
          <th class="right">Qtd</th>
          <th class="right">Preço Un.</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td colspan="5">TOTAL DO PERÍODO</td>
          <td class="right">${fmtCur(total)}</td>
        </tr>
      </tbody>
    </table>
    <p style="margin-top:12px;font-size:9px;color:#9ca3af">
      * Pedidos importados da planilha histórica não possuem detalhamento por item.
      Novos pedidos lançados no sistema exibem todos os itens.
    </p>
  `
}

// ── Relatório 2: Extrato por Vencimento (sintético) ───────────────────────

function buildHTMLExtrato(due_date: string, prevDue: string, orders: any[], payments: any[], saldoAtrasado: number, saldoAVencer: number, today: string): string {
  const totalPedidos    = orders.reduce((s: number, o: any) => s + Number(o.total_amount), 0)
  const totalPagamentos = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const isDueInFuture   = due_date > today
  const totalDevedor    = saldoAtrasado + saldoAVencer + totalPedidos
  const saldo           = Math.max(0, totalDevedor - totalPagamentos)

  const saldoAtrasadoRow = saldoAtrasado > 0 ? `
    <tr class="section-title"><td colspan="4">SALDO EM ATRASO (ciclos vencidos antes de ${fmtDate(today)})</td></tr>
    <tr>
      <td>—</td>
      <td>Saldo de ciclos vencidos em aberto</td>
      <td class="right" style="color:#dc2626;font-weight:bold">${fmtCur(saldoAtrasado)}</td>
      <td class="right">—</td>
    </tr>` : ''

  const saldoAVencerRow = saldoAVencer > 0 ? `
    <tr class="section-title"><td colspan="4">SALDO A VENCER (ciclos futuros em aberto)</td></tr>
    <tr>
      <td>—</td>
      <td>Saldo de ciclos ainda não vencidos</td>
      <td class="right" style="color:#d97706;font-weight:bold">${fmtCur(saldoAVencer)}</td>
      <td class="right">—</td>
    </tr>` : ''

  const orderRows = orders.map((o: any) => `
    <tr>
      <td>${fmtDate(o.order_date)}</td>
      <td>${o.description || '—'}</td>
      <td class="right">${fmtCur(o.total_amount)}</td>
      <td class="right">—</td>
    </tr>`).join('')

  const paymentRows = payments.map((p: any) => `
    <tr class="pgto">
      <td>${fmtDate(p.payment_date)}</td>
      <td>${p.notes && p.notes !== 'importado' ? p.notes : 'Pagamento'}</td>
      <td class="right">—</td>
      <td class="right">${fmtCur(p.amount)}</td>
    </tr>`).join('')

  const totalDevedorRow = (saldoAtrasado > 0 || saldoAVencer > 0) ? `
    <tr class="total-row">
      <td colspan="2">TOTAL DEVEDOR (atraso + a vencer + ciclo atual)</td>
      <td class="right">${fmtCur(totalDevedor)}</td>
      <td></td>
    </tr>` : ''

  return `
    <header>
      <h1>Extrato por Vencimento</h1>
      <p>Vencimento: ${formatDateBR(due_date)} — Emitido com base em: ${fmtDate(today)}</p>
    </header>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th class="right">Débito</th>
          <th class="right">Crédito (Pagamento)</th>
        </tr>
      </thead>
      <tbody>
        ${saldoAtrasadoRow}
        ${saldoAVencerRow}
        <tr class="section-title"><td colspan="4">PEDIDOS DO CICLO — vencimento ${formatDateBR(due_date)}</td></tr>
        ${orderRows || '<tr><td colspan="4" style="color:#999;padding:6px 8px">Nenhum pedido neste ciclo.</td></tr>'}
        <tr class="total-row">
          <td colspan="2">Subtotal Pedidos do Ciclo</td>
          <td class="right">${fmtCur(totalPedidos)}</td>
          <td></td>
        </tr>
        ${totalDevedorRow}
        <tr class="section-title"><td colspan="4">PAGAMENTOS RECEBIDOS — referentes ao vencimento ${formatDateBR(due_date)}</td></tr>
        ${paymentRows || '<tr><td colspan="4" style="color:#999;padding:6px 8px">Nenhum pagamento registrado.</td></tr>'}
        <tr class="total-row">
          <td colspan="3">Subtotal Pagamentos</td>
          <td class="right">${fmtCur(totalPagamentos)}</td>
        </tr>
      </tbody>
    </table>
    <div class="saldo-final">
      Saldo em aberto: <span>${fmtCur(saldo)}</span>
    </div>
  `
}

// ── Componente principal ───────────────────────────────────────────────────

export default function RelatoriosClient({ ciclos }: Props) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [loadingPedidos, setLoadingPedidos] = useState(false)
  const [erroPedidos, setErroPedidos] = useState('')

  const [selectedCiclo, setSelectedCiclo] = useState('')
  const [loadingExtrato, setLoadingExtrato] = useState(false)
  const [erroExtrato, setErroExtrato] = useState('')

  const gerarPedidos = async () => {
    setErroPedidos('')
    if (!dateFrom || !dateTo) { setErroPedidos('Informe as duas datas.'); return }
    if (dateFrom > dateTo)    { setErroPedidos('Data inicial maior que final.'); return }
    setLoadingPedidos(true)
    try {
      const res  = await fetch(`/api/relatorios/pedidos?from=${dateFrom}&to=${dateTo}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar dados.')
      emitirPDF(
        buildHTMLPedidos(data.orders, dateFrom, dateTo),
        `Pedidos ${formatDateBR(dateFrom)} a ${formatDateBR(dateTo)}`
      )
    } catch (e: any) {
      setErroPedidos(e.message)
    } finally {
      setLoadingPedidos(false)
    }
  }

  const gerarExtrato = async () => {
    setErroExtrato('')
    if (!selectedCiclo) { setErroExtrato('Selecione um vencimento.'); return }
    setLoadingExtrato(true)
    try {
      const res  = await fetch(`/api/relatorios/extrato?due_date=${selectedCiclo}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar dados.')
      emitirPDF(
        buildHTMLExtrato(selectedCiclo, data.prevDue, data.orders, data.payments, data.saldoAtrasado ?? 0, data.saldoAVencer ?? 0, data.today ?? new Date().toISOString().substring(0,10)),
        `Extrato Vencimento ${formatDateBR(selectedCiclo)}`
      )
    } catch (e: any) {
      setErroExtrato(e.message)
    } finally {
      setLoadingExtrato(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <div className="card p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-gray-800">Relatório de Pedidos</h2>
          <p className="text-xs text-gray-500 mt-1">Analítico — detalha cada pedido com seus itens</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Data inicial</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Data final</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" />
          </div>
        </div>
        {erroPedidos && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erroPedidos}</p>}
        <button onClick={gerarPedidos} disabled={loadingPedidos} className="btn-primary w-full">
          {loadingPedidos ? 'Gerando…' : '📄 Gerar PDF'}
        </button>
        <p className="text-xs text-gray-400">
          * Pedidos importados da planilha não possuem detalhamento por item. Novos pedidos lançados no sistema exibem todos os itens.
        </p>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-gray-800">Extrato por Vencimento</h2>
          <p className="text-xs text-gray-500 mt-1">Sintético — pedidos e pagamentos do ciclo, estilo conta corrente</p>
        </div>
        <div>
          <label className="label">Vencimento</label>
          <select value={selectedCiclo} onChange={e => setSelectedCiclo(e.target.value)} className="input">
            <option value="">Selecione o vencimento…</option>
            {ciclos.map(c => (
              <option key={c.due_date} value={c.due_date}>{formatDateBR(c.due_date)}</option>
            ))}
          </select>
        </div>
        {erroExtrato && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erroExtrato}</p>}
        <button onClick={gerarExtrato} disabled={loadingExtrato} className="btn-primary w-full">
          {loadingExtrato ? 'Gerando…' : '📄 Gerar PDF'}
        </button>
        <p className="text-xs text-gray-400">
          Mostra pagamentos recebidos entre o vencimento anterior e o vencimento selecionado.
        </p>
      </div>

    </div>
  )
}
