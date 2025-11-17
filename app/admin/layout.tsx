"use client"

import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  if (status === "loading" || (status === "authenticated" && (session?.user as any)?.role !== "ADMIN")) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return children
}
