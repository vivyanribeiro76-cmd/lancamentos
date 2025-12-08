"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function GestorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Área do Gestor</div>
            <nav className="flex gap-4 text-sm">
              <Link href="/gestor/dashboard" className={pathname === '/gestor/dashboard' ? 'font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-900'}>
                Dashboard
              </Link>
              <Link href="/gestor/recordings" className={pathname === '/gestor/recordings' ? 'font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-900'}>
                Gravações
              </Link>
              <Link href="/gestor/dados" className={pathname === '/gestor/dados' ? 'font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-900'}>
                Dados
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
