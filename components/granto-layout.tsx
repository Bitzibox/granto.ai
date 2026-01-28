'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Search,
  FileText,
  Calendar,
  Building2,
  Settings,
  Bell,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Mes projets', href: '/projets', icon: FolderKanban },
  { name: 'Recherche subventions', href: '/recherche-subventions', icon: Search },
  { name: 'Mes dossiers', href: '/dossiers', icon: FileText },
  { name: 'Calendrier', href: '/calendrier', icon: Calendar },
  { name: 'Collectivités', href: '/collectivites', icon: Building2 },
]

export function GrantoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white">
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-xl font-bold">G</span>
          </div>
          <div>
            <div className="text-lg font-bold">Granto</div>
            <div className="text-xs text-slate-400">Assistant subventions</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
            <Settings className="h-5 w-5" />
            Paramètres
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-900">
              {navigation.find((item) => item.href === pathname)?.name || 'Granto'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-full p-2 hover:bg-slate-100">
              <Bell className="h-5 w-5 text-slate-600" />
            </button>
            <button className="flex items-center gap-2 rounded-full bg-slate-100 py-2 px-3 hover:bg-slate-200">
              <User className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Utilisateur</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  )
}
