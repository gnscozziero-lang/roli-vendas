import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Roli Vendas',
  description: 'Controle de pedidos e pagamentos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <nav className="bg-green-800 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-14">
            <Link href="/" className="font-bold text-lg tracking-tight">🔑 Roli Vendas</Link>
            <Link href="/pedidos"   className="text-green-100 hover:text-white text-sm transition-colors">Pedidos</Link>
            <Link href="/pagamentos" className="text-green-100 hover:text-white text-sm transition-colors">Pagamentos</Link>
            <Link href="/itens"     className="text-green-100 hover:text-white text-sm transition-colors">Itens</Link>
            <Link href="/relatorios" className="text-green-100 hover:text-white text-sm transition-colors">Relatórios</Link>
            <Link href="/importar"  className="text-green-100 hover:text-white text-sm transition-colors ml-auto">Importar</Link>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
