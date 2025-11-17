"use client"

import { useState, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Navbar from "@/components/navbar"
import AdminSidebar from "@/components/admin-sidebar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, CheckCircle2, XCircle } from 'lucide-react'

export default function AgentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [pageLoading, setPageLoading] = useState(true)

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/agents")
      if (res.ok) {
        const data = await res.json()
        setAgents(data)
      }
    } catch (err) {
      console.error("Failed to fetch agents", err)
    } finally {
      setPageLoading(false)
    }
  }, [])

  useState(() => {
    if (status === "authenticated") {
      if ((session?.user as any)?.role !== "ADMIN") {
        router.push("/dashboard")
      } else {
        fetchAgents()
      }
    }
  }, [status, session, router, fetchAgents])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "AGENT",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "فشل التسجيل")
        return
      }

      setFormData({ name: "", email: "", password: "" })
      setOpenDialog(false)
      fetchAgents()
    } catch (err) {
      setError("حدث خطأ. حاول مرة أخرى.")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">جاري التحميل...</div>
      </div>
    )
  }

  if (status === "unauthenticated" || (session?.user as any)?.role !== "ADMIN") {
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

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">إدارة الوكلاء</h1>
                <p className="text-muted-foreground">أضف وأدر أعضاء الفريق</p>
              </div>
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-secondary text-primary-foreground gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة وكيل
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">إضافة وكيل جديد</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      أدخل تفاصيل الوكيل الجديد. يمكنه تسجيل الدخول بهذه البيانات لاحقاً.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">الاسم</label>
                      <Input
                        type="text"
                        name="name"
                        placeholder="الاسم الكامل"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="bg-input border-input-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">البريد الإلكتروني</label>
                      <Input
                        type="email"
                        name="email"
                        placeholder="البريد الإلكتروني"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="bg-input border-input-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">كلمة المرور</label>
                      <Input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="bg-input border-input-border text-foreground"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenDialog(false)}
                        disabled={loading}
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-secondary text-primary-foreground flex-1"
                        disabled={loading}
                      >
                        {loading ? "جاري الإضافة..." : "إضافة وكيل"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">الوكلاء ({agents.length})</CardTitle>
                <CardDescription className="text-muted-foreground">
                  قائمة بجميع الوكلاء المسجلين في النظام
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-2">
                {agents.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">لا توجد وكلاء حتى الآن</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted border-border">
                          <TableHead className="text-right text-foreground">الاسم</TableHead>
                          <TableHead className="text-right text-foreground">البريد الإلكتروني</TableHead>
                          <TableHead className="text-right text-foreground">تاريخ الإنشاء</TableHead>
                          <TableHead className="text-center text-foreground">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agents.map((agent: any) => (
                          <TableRow key={agent.id} className="border-border hover:bg-muted/50">
                            <TableCell className="text-right text-foreground font-medium">{agent.name}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{agent.email}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {new Date(agent.createdAt).toLocaleDateString("ar-SA")}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-accent" />
                                <span className="text-sm text-accent">نشط</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
