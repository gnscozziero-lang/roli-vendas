import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vendas',
  description: 'Sistema de controle de vendas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <nav id="main-nav" className="bg-green-800 h-14 flex items-center px-6 print:hidden">
          <span className="text-white font-bold text-lg mr-8">🔑 Vendas</span>
          <div className="flex items-center gap-6 text-sm flex-1">
            <Link href="/" className="text-green-100 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/pedidos" className="text-green-100 hover:text-white transition-colors">Pedidos</Link>
            <Link href="/pagamentos" className="text-green-100 hover:text-white transition-colors">Pagamentos</Link>
            <Link href="/itens" className="text-green-100 hover:text-white transition-colors">Itens</Link>
            <Link href="/clientes" className="text-green-100 hover:text-white transition-colors">Clientes</Link>
            <Link href="/relatorios" className="text-green-100 hover:text-white transition-colors">Relatórios</Link>
            <Link href="/importar" className="text-green-100 hover:text-white transition-colors ml-auto">Importar</Link>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
        <footer className="text-center text-xs text-gray-400 py-4 print:hidden">v01 — 26/05/2026 14:28</footer>
      </body>
    </html>
  )
}
