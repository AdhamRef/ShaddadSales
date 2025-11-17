"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Database, TrendingUp, Settings, Users } from 'lucide-react'

const menuItems = [
  { name: "لوحة الإحصائيات", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "إدارة الوكلاء", href: "/admin/agents", icon: Users },
  { name: "الإدخالات اليومية", href: "/admin/daily-inputs", icon: Database },
  { name: "العملاء المؤهلين", href: "/admin/qualified-leads", icon: TrendingUp },
  { name: "حاسبة KPI", href: "/admin/kpi-calculator", icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname?.startsWith(path)

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
                  ? "bg-gradient-to-r from-blue-600/10 to-indigo-600/10 text-blue-700 border border-blue-600/20"
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
