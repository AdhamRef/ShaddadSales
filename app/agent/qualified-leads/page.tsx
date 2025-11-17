"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import NavbarAgent from "@/components/navbar-agent"
import AgentSidebar from "@/components/agent-sidebar"
import CycleSelector from "@/components/cycle-selector"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit2, Calendar, Phone, User, MapPin } from 'lucide-react'

interface Cycle {
  id: string
  name: string
}

interface QualifiedLead {
  id: string
  leadName: string
  phoneNumber: string
  facebookProfile: string
  dateCollected: string
  status: string
}

const STATUSES = ["مؤهل", "تم الاتصال", "قيد الانتظار", "مغلق", "غير مهتم"]

export default function AgentLeadsPage() {
  const { data: session } = useSession()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null)
  const [leads, setLeads] = useState<QualifiedLead[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    leadName: "",
    phoneNumber: "",
    facebookProfile: "",
    dateCollected: new Date().toISOString().split("T")[0],
    status: "مؤهل",
  })

  useEffect(() => {
    fetchCycles()
  }, [])

  useEffect(() => {
    if (activeCycle) {
      fetchLeads()
    }
  }, [activeCycle, session])

  const fetchCycles = async () => {
    try {
      const res = await fetch("/api/cycles")
      const data = await res.json()
      setCycles(data)
      if (data.length > 0) {
        setActiveCycle(data[0])
      }
    } catch (error) {
      console.error("Failed to fetch cycles:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeads = async () => {
    if (!activeCycle || !session?.user?.name) return

    try {
      const res = await fetch(`/api/qualified-leads?cycleId=${activeCycle.id}`)
      const allLeads = await res.json()
      const agentLeads = allLeads.filter((lead: any) => lead.agentName === session.user?.name)
      setLeads(agentLeads)
    } catch (error) {
      console.error("Failed to fetch leads:", error)
    }
  }

  const handleAddOrUpdate = async () => {
    if (!activeCycle || !session?.user?.email || !formData.leadName || !formData.phoneNumber) {
      alert("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    try {
      const userRes = await fetch(`/api/auth/user?email=${session.user.email}`)
      const userData = await userRes.json()

      const payload = {
        ...formData,
        cycleId: activeCycle.id,
        agentId: userData.id,
      }

      let result
      if (editingId) {
        result = await fetch("/api/qualified-leads", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
      } else {
        result = await fetch("/api/qualified-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (result.ok) {
        fetchLeads()
        resetForm()
        setOpenDialog(false)
      }
    } catch (error) {
      console.error("Failed to save lead:", error)
    }
  }

  const handleEdit = (lead: QualifiedLead) => {
    setFormData({
      leadName: lead.leadName,
      phoneNumber: lead.phoneNumber,
      facebookProfile: lead.facebookProfile,
      dateCollected: lead.dateCollected,
      status: lead.status,
    })
    setEditingId(lead.id)
    setOpenDialog(true)
  }

  const resetForm = () => {
    setFormData({
      leadName: "",
      phoneNumber: "",
      facebookProfile: "",
      dateCollected: new Date().toISOString().split("T")[0],
      status: "مؤهل",
    })
    setEditingId(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "مؤهل":
        return "bg-accent/20 text-accent border-accent/30"
      case "تم الاتصال":
        return "bg-primary/20 text-primary border-primary/30"
      case "مغلق":
        return "bg-secondary/20 text-secondary border-secondary/30"
      case "قيد الانتظار":
        return "bg-accent-light-blue/20 text-accent-light-blue border-accent-light-blue/30"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <AgentSidebar />
        <div className="flex-1 flex flex-col">
          <NavbarAgent />
          <div className="flex items-center justify-center flex-1">
            <div className="text-foreground">جاري التحميل...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <AgentSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <NavbarAgent />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">عملائي المؤهلين</h1>
              <p className="text-muted-foreground">تتبع وإدارة العملاء المؤهلين الخاصين بك</p>
            </div>

            <CycleSelector cycles={cycles} activeCycle={activeCycle} onSelect={setActiveCycle} />

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-secondary text-primary-foreground gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة عميل جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground text-right">{editingId ? "تعديل العميل" : "إضافة عميل مؤهل جديد"}</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-right">
                    أدخل تفاصيل العميل الجديد
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 text-right">اسم العميل *</label>
                      <Input
                        placeholder="الاسم الكامل"
                        value={formData.leadName}
                        onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                        className="bg-input border-input-border text-foreground text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 text-right">رقم الهاتف *</label>
                      <Input
                        placeholder="+20 xxx xxxx xxx"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="bg-input border-input-border text-foreground text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 text-right">حساب فيسبوك</label>
                      <Input
                        placeholder="facebook.com/profile"
                        value={formData.facebookProfile}
                        onChange={(e) => setFormData({ ...formData, facebookProfile: e.target.value })}
                        className="bg-input border-input-border text-foreground text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 text-right">تاريخ الجمع</label>
                      <Input
                        type="date"
                        value={formData.dateCollected}
                        onChange={(e) => setFormData({ ...formData, dateCollected: e.target.value })}
                        className="bg-input border-input-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2 text-right">الحالة</label>
                      <select
                        className="w-full px-3 py-2 bg-input border border-input-border rounded-lg text-foreground text-right"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpenDialog(false)
                        resetForm()
                      }}
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddOrUpdate}
                      className="bg-primary hover:bg-secondary text-primary-foreground flex-1"
                    >
                      {editingId ? "تحديث العميل" : "إضافة عميل"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-foreground">العملاء المؤهلين</CardTitle>
                <CardDescription className="text-muted-foreground">{leads.length} عميل</CardDescription>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">لا توجد عملاء مؤهلين حتى الآن. أضف أول عميل مؤهل أعلاه.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{lead.leadName}</h3>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {lead.phoneNumber}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(lead.dateCollected).toLocaleDateString("ar-SA")}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(lead)}
                            className="text-primary hover:bg-primary/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
