import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vendas',
  description: 'Sistema de controle de vendas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <nav id="main-nav" className="bg-gray-800 text-white px-6 py-3 flex gap-6 text-sm print:hidden">
          <Link href="/" className="hover:text-gray-300">Dashboard</Link>
          <Link href="/pedidos" className="hover:text-gray-300">Pedidos</Link>
          <Link href="/pagamentos" className="hover:text-gray-300">Pagamentos</Link>
          <Link href="/itens" className="hover:text-gray-300">Itens</Link>
          <Link href="/clientes" className="hover:text-gray-300">Clientes</Link>
          <Link href="/relatorios" className="hover:text-gray-300">Relatórios</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
