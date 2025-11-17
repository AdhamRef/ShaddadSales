"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings } from 'lucide-react'

export default function Navbar() {
  const { data: session } = useSession()
  const roleText = (session?.user as any)?.role === "ADMIN" ? "المدير" : "الوكيل"

  return (
    <nav className="bg-card border-b border-border px-8 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-card font-bold text-lg">
          ا
        </div>
        <div>
          <span className="font-bold text-lg text-foreground">أداء المبيعات</span>
          <div className="text-xs text-muted-foreground">نظام إدارة الأداء</div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground">{session?.user?.name}</div>
          <div className="text-xs text-accent-purple font-medium">{roleText}</div>
        </div>
        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-foreground" />
        </div>
        <Button 
          onClick={() => signOut({ callbackUrl: "/login" })} 
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-red-50 dark:hover:bg-red-950 gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">تسجيل الخروج</span>
        </Button>
      </div>
    </nav>
  )
}
