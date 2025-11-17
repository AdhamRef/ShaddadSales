"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { BarChart3, ClipboardList } from 'lucide-react'

const menuItems = [
  { name: "أدائي", href: "/dashboard", icon: BarChart3 },
  { name: "عملائي المؤهلين", href: "/agent/qualified-leads", icon: ClipboardList },
]

export default function AgentSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname?.startsWith(path)
  }

  return (
    <aside className="w-64 bg-card border-border border-l flex flex-col shadow-sm">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">القائمة</h2>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-accent/10 to-accent-teal/10 text-accent font-semibold border border-accent/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-border bg-muted/50">
        <p className="text-xs text-muted-foreground text-center">
          v1.0.0
        </p>
      </div>
    </aside>
  )
}
