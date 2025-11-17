"use client"

import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-foreground">جاري التحميل...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
    return <div>Admin Registration Panel</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="text-destructive">غير مصرح</div>
        </CardContent>
      </Card>
    </div>
  )
}
