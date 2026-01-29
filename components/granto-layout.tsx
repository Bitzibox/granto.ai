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
    <div className="min-h-screen bg-background bg-mesh-gradient">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border shadow-elegant backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow-primary">
            <span className="text-xl font-bold text-primary-foreground">G</span>
          </div>
          <div>
            <div className="text-lg font-bold text-sidebar-foreground">Granto</div>
            <div className="text-xs text-muted-foreground">Assistant subventions</div>
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
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'bg-gradient-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.02] hover:shadow-sm'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 hover:scale-[1.02]">
            <Settings className="h-5 w-5" />
            Paramètres
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border glass px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground">
              {navigation.find((item) => item.href === pathname)?.name || 'Granto'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-full p-2 hover:bg-accent transition-all duration-300 hover:scale-110">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="flex items-center gap-2 rounded-full bg-secondary/50 backdrop-blur-sm py-2 px-4 hover:bg-secondary transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-border/50">
              <User className="h-5 w-5 text-secondary-foreground" />
              <span className="text-sm font-medium text-secondary-foreground">Utilisateur</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] p-8">{children}</main>
      </div>
    </div>
  )
}
