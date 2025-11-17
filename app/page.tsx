"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'


export default function Page() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
    } else if ((session.user as any)?.role === "ADMIN") {
      router.push("/admin/dashboard")
    } else {
      router.push("/dashboard")
    }
  }, [status, session, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
