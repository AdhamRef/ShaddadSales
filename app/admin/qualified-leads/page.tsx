"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Navbar from "@/components/navbar"
import AdminSidebar from "@/components/admin-sidebar"
import CycleSelector from "@/components/cycle-selector"

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

interface QualifiedLead {
  id: string
  agentName: string
  leadName: string
  phoneNumber: string
  facebookProfile: string
  dateCollected: string
  status: string
}

const STATUSES = ["Qualified", "Contacted", "Pending", "Closed", "Not Interested"]

export default function QualifiedLeadsPage() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [leads, setLeads] = useState<QualifiedLead[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    agentId: "",
    leadName: "",
    phoneNumber: "",
    facebookProfile: "",
    dateCollected: new Date().toISOString().split("T")[0],
    status: "Qualified",
  })

  useEffect(() => {
    fetchCycles()
    fetchAgents()
  }, [])

  useEffect(() => {
    if (activeCycle) {
      fetchLeads()
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
      console.error("Failed to fetch agents:", error)
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
      console.error("Failed to fetch cycles:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeads = async () => {
    if (!activeCycle) return

    try {
      const res = await fetch(`/api/qualified-leads?cycleId=${activeCycle.id}`)
      const data = await res.json()
      setLeads(data)
    } catch (error) {
      console.error("Failed to fetch leads:", error)
    }
  }

  const handleAddOrUpdate = async () => {
    if (!activeCycle || !formData.agentId || !formData.leadName || !formData.phoneNumber) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const payload = {
        ...formData,
        cycleId: activeCycle.id,
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
        setShowForm(false)
      }
    } catch (error) {
      console.error("Failed to save lead:", error)
    }
  }

  const handleEdit = (lead: QualifiedLead) => {
    const agent = agents.find((a) => a.name === lead.agentName)
    setFormData({
      agentId: agent?.id || "",
      leadName: lead.leadName,
      phoneNumber: lead.phoneNumber,
      facebookProfile: lead.facebookProfile,
      dateCollected: lead.dateCollected,
      status: lead.status,
    })
    setEditingId(lead.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      agentId: agents.length > 0 ? agents[0].id : "",
      leadName: "",
      phoneNumber: "",
      facebookProfile: "",
      dateCollected: new Date().toISOString().split("T")[0],
      status: "Qualified",
    })
    setEditingId(null)
  }

  const handleExportExcel = () => {
    if (leads.length === 0) {
      alert("No data to export")
      return
    }

    let csv = "Agent,Lead Name,Phone,Facebook,Date,Status\n"

    leads.forEach((lead) => {
      csv += `${lead.agentName},"${lead.leadName}",${lead.phoneNumber},"${lead.facebookProfile}",${lead.dateCollected},${lead.status}\n`
    })

    const element = document.createElement("a")
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv))
    element.setAttribute("download", `qualified_leads_${activeCycle?.name || "export"}.csv`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
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
                <h1 className="text-3xl font-bold text-gray-900">Qualified Leads Tracker</h1>
                <p className="text-gray-600 mt-1">Track and manage qualified leads</p>
              </div>
              <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
                Export CSV
              </Button>
            </div>

            <CycleSelector cycles={cycles} activeCycle={activeCycle} onSelect={setActiveCycle} />

            <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
              Add New Lead
            </Button>

            {showForm && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle>{editingId ? "Edit Lead" : "Add New Qualified Lead"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lead Name *</label>
                      <Input
                        placeholder="Full name"
                        value={formData.leadName}
                        onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <Input
                        placeholder="+20 xxx xxxx xxx"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Profile</label>
                      <Input
                        placeholder="facebook.com/profile"
                        value={formData.facebookProfile}
                        onChange={(e) => setFormData({ ...formData, facebookProfile: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Collected</label>
                      <Input
                        type="date"
                        value={formData.dateCollected}
                        onChange={(e) => setFormData({ ...formData, dateCollected: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <div className="flex gap-2">
                    <Button onClick={handleAddOrUpdate} className="bg-green-600 hover:bg-green-700">
                      {editingId ? "Update" : "Add"} Lead
                    </Button>
                    <Button
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>All Qualified Leads</CardTitle>
                <CardDescription>{leads.length} total leads</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Agent</th>
                      <th className="px-4 py-2 text-left font-semibold">Lead Name</th>
                      <th className="px-4 py-2 text-left font-semibold">Phone</th>
                      <th className="px-4 py-2 text-left font-semibold">Date</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                      <th className="px-4 py-2 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length > 0 ? (
                      leads.map((lead, index) => (
                        <tr
                          key={lead.id}
                          className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                        >
                          <td className="px-4 py-3 font-medium">{lead.agentName}</td>
                          <td className="px-4 py-3">{lead.leadName}</td>
                          <td className="px-4 py-3">{lead.phoneNumber}</td>
                          <td className="px-4 py-3">{new Date(lead.dateCollected).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                lead.status === "Qualified"
                                  ? "bg-green-100 text-green-800"
                                  : lead.status === "Contacted"
                                    ? "bg-blue-100 text-blue-800"
                                    : lead.status === "Closed"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(lead)}>
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No leads yet. Add your first qualified lead above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
