import type { Metadata } from 'next'
import './globals.css'
import NavBar from './NavBar'

export const metadata: Metadata = {
  title: 'Vendas',
  description: 'Sistema de controle de vendas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <NavBar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
        <footer className="text-center text-xs text-gray-400 py-4 print:hidden">v01 — 26/05/2026 14:28</footer>
      </body>
    </html>
  )
}
