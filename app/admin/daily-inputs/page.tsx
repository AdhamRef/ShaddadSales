"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Navbar from "@/components/navbar"
import AdminSidebar from "@/components/admin-sidebar"
import CycleSelector from "@/components/cycle-selector"
import DataEntryTable from "@/components/data-entry-table"
import { Plus } from "lucide-react"

interface Cycle {
  id: string
  name: string
  month: number
  year: number
  isActive: boolean
}

interface Agent {
  id: string
  name: string
  email: string
}

interface DailyInput {
  id: string
  date: string
  agentName: string
  messagesReceived: number
  callsDone: number
  closings: number
  avgResponseTime: number
  notes?: string
}

export default function DailyInputsPage() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [inputs, setInputs] = useState<DailyInput[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [history, setHistory] = useState<DailyInput[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    agentId: "",
    messagesReceived: 0,
    callsDone: 0,
    closings: 0,
    avgResponseTime: 0,
    notes: "",
  })

  useEffect(() => {
    fetchCycles()
    fetchAgents()
  }, [])

  useEffect(() => {
    if (activeCycle) {
      fetchInputs()
    }
  }, [activeCycle])

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/auth/agents")
      const data = await res.json()
      setAgents(data)
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, agentId: data[0].id }))
      }
    } catch (error) {
      console.error("فشل في جلب الوكلاء:", error)
    }
  }

  const fetchCycles = async () => {
    try {
      const res = await fetch("/api/cycles")
      const data = await res.json()
      setCycles(data)
      if (data.length > 0) {
        setActiveCycle(data[0])
      }
    } catch (error) {
      console.error("فشل في جلب الدورات:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInputs = async () => {
    if (!activeCycle) return

    try {
      const res = await fetch(`/api/daily-inputs?cycleId=${activeCycle.id}`)
      const data = await res.json()
      setInputs(data)
      setHistory([data])
      setHistoryIndex(0)
    } catch (error) {
      console.error("فشل في جلب الإدخالات:", error)
    }
  }

  const updateHistory = (newInputs: DailyInput[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newInputs)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setInputs(newInputs)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setInputs(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setInputs(history[historyIndex + 1])
    }
  }

  const handleAddOrUpdate = async () => {
    if (!activeCycle || !formData.agentId) return

    try {
      let result
      const payload = {
        ...formData,
        cycleId: activeCycle.id,
        messagesReceived: parseInt(formData.messagesReceived as any),
        callsDone: parseInt(formData.callsDone as any),
        closings: parseInt(formData.closings as any),
        avgResponseTime: parseFloat(formData.avgResponseTime as any),
      }

      if (editingId) {
        result = await fetch("/api/daily-inputs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
      } else {
        result = await fetch("/api/daily-inputs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (result.ok) {
        const agentName = agents.find((a) => a.id === formData.agentId)?.name || "غير معروف"
        const updatedInputs = editingId
          ? inputs.map((input) =>
              input.id === editingId
                ? { ...input, ...formData, agentName }
                : input
            )
          : [...inputs, { id: Date.now().toString(), ...formData, agentName }]

        updateHistory(updatedInputs)
        resetForm()
        setShowForm(false)
      }
    } catch (error) {
      console.error("فشل في حفظ الإدخال:", error)
    }
  }

  const handleEdit = (input: DailyInput) => {
    const agent = agents.find((a) => a.name === input.agentName)
    setFormData({
      date: input.date,
      agentId: agent?.id || "",
      messagesReceived: input.messagesReceived,
      callsDone: input.callsDone,
      closings: input.closings,
      avgResponseTime: input.avgResponseTime,
      notes: input.notes || "",
    })
    setEditingId(input.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد أنك تريد حذف هذا الإدخال؟")) {
      const updatedInputs = inputs.filter((input) => input.id !== id)
      updateHistory(updatedInputs)
    }
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      agentId: agents.length > 0 ? agents[0].id : "",
      messagesReceived: 0,
      callsDone: 0,
      closings: 0,
      avgResponseTime: 0,
      notes: "",
    })
    setEditingId(null)
  }

  const handleExportExcel = () => {
    if (inputs.length === 0) {
      alert("لا توجد بيانات للتصدير")
      return
    }

    let csv = "التاريخ,الوكيل,الرسائل,المكالمات,الإغلاقات,متوسط الاستجابة,ملاحظات\n"

    inputs.forEach((input) => {
      csv += `${input.date},${input.agentName},${input.messagesReceived},${input.callsDone},${input.closings},${input.avgResponseTime},"${(input.notes || "").replace(/"/g, '""')}"\n`
    })

    const element = document.createElement("a")
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv))
    element.setAttribute("download", `daily_inputs_${activeCycle?.name || "export"}.csv`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جارٍ التحميل...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Daily Inputs Tracker</h1>
                <p className="text-gray-600 mt-1">أدخل أنشطة المبيعات اليومية</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUndo} disabled={historyIndex <= 0} variant="outline">
                  ← تراجع
                </Button>
                <Button onClick={handleRedo} disabled={historyIndex >= history.length - 1} variant="outline">
                  إعادة → 
                </Button>
                <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
                  تصدير CSV
                </Button>
              </div>
            </div>
<div className="w-full flex gap-2 items-center">

            <CycleSelector cycles={cycles} activeCycle={activeCycle} onSelect={setActiveCycle} />

            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 gap-1">
            <Plus className="w-5 h-5"/>أضف 
            </Button>
</div>

            {showForm && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle>{editingId ? "تعديل الإدخال" : "إضافة إدخال يومي جديد"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الوكيل</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formData.agentId}
                        onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                      >
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الرسائل المستلمة</label>
                      <Input
                        type="number"
                        value={formData.messagesReceived}
                        onChange={(e) => setFormData({ ...formData, messagesReceived: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المكالمات المنجزة</label>
                      <Input
                        type="number"
                        value={formData.callsDone}
                        onChange={(e) => setFormData({ ...formData, callsDone: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الإغلاقات</label>
                      <Input
                        type="number"
                        value={formData.closings}
                        onChange={(e) => setFormData({ ...formData, closings: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">متوسط الاستجابة (دقائق)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.avgResponseTime}
                        onChange={(e) => setFormData({ ...formData, avgResponseTime: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddOrUpdate} className="bg-green-600 hover:bg-green-700">
                      {editingId ? "تحديث" : "إضافة"} الإدخال
                    </Button>
                    <Button
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                      variant="outline"
                    >
                      إلغاء
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <DataEntryTable inputs={inputs} onEdit={handleEdit} onDelete={handleDelete} />
          </div>
        </div>
      </div>
    </div>
  )
}
