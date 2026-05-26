'use client';

import { useState } from 'react';
import { calculateBalances, formatCurrency, formatDateBR } from '@/lib/billing';
import { Order, Payment, Client } from '@/types';

interface Props {
  orders: Order[];
  payments: Payment[];
  clients: Client[];
}

export default function DashboardClient({ orders, payments, clients }: Props) {
  const [selectedClient, setSelectedClient] = useState('');

  const filteredOrders = selectedClient
    ? orders.filter(o => o.client === selectedClient)
    : orders;

  const filteredPayments = selectedClient
    ? payments.filter(p => p.client === selectedClient)
    : payments;

  const { cycles, totalOpen, nextDue, overdue } = calculateBalances(filteredOrders, filteredPayments);

  return (
    <div>
      {/* Client filter */}
      <div className="mb-6 print:hidden">
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Todos os clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        {selectedClient && (
          <span className="ml-3 text-sm text-gray-500">Exibindo: {selectedClient}</span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Total em Aberto</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalOpen)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Em Atraso</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(overdue)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">A Vencer</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(nextDue)}</p>
        </div>
      </div>

      {/* Cycles table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-3">Vencimento</th>
              <th className="text-right px-4 py-3">Pedidos</th>
              <th className="text-right px-4 py-3">Pagamentos</th>
              <th className="text-right px-4 py-3">Saldo</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {cycles.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">Nenhum ciclo encontrado</td>
              </tr>
            )}
            {cycles.map((cycle: any) => (
              <tr key={cycle.due_date} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{formatDateBR(cycle.due_date)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(cycle.orders_total)}</td>
                <td className="px-4 py-3 text-right text-green-700">{formatCurrency(cycle.payments_total)}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatCurrency(cycle.balance)}
                </td>
                <td className="px-4 py-3 text-center">
                  {cycle.balance <= 0 ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Quitado</span>
                  ) : cycle.overdue ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Atrasado</span>
                  ) : (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">A vencer</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
