"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import NavbarAgent from "@/components/navbar-agent"
import AgentSidebar from "@/components/agent-sidebar"
import CycleSelector from "@/components/cycle-selector"
import { 
  TrendingUp, Users, Phone, MessageCircle, Award, Clock, 
  BarChart3, Target, CheckCircle, Trophy 
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"

interface Cycle {
  id: string
  name: string
  month: number
  year: number
  isActive: boolean
}

interface DailyInput {
  id: string
  date: string
  agentName: string
  messagesReceived: number
  callsDone: number
  closings: number
  avgResponseTime: number
  qualifiedLeadsCount?: number
}

interface AgentStats {
  totalMessages: number
  totalCalls: number
  totalClosings: number
  avgResponseTime: number
  closingRate: number
  callConversion: number
  estimatedScore: number
  qualifiedLeadsCount: number
}

interface QualifiedLead {
  id: string
  agentName: string
  cycleId: string
}

interface PerformanceScore {
  closingScore: number
  callConvScore: number
  responseScore: number
  qualLeadsScore: number
  totalScore: number
}

export default function AgentDashboard() {
  const { data: session } = useSession()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null)
  const [stats, setStats] = useState<AgentStats>({
    totalMessages: 0,
    totalCalls: 0,
    totalClosings: 0,
    avgResponseTime: 0,
    closingRate: 0,
    callConversion: 0,
    estimatedScore: 0,
    qualifiedLeadsCount: 0,
  })
  const [scores, setScores] = useState<PerformanceScore>({
    closingScore: 0,
    callConvScore: 0,
    responseScore: 0,
    qualLeadsScore: 0,
    totalScore: 0,
  })
  const [recentEntries, setRecentEntries] = useState<DailyInput[]>([])
  const [leads, setLeads] = useState<QualifiedLead[]>([])
  const [loading, setLoading] = useState(true)

  // Targets from config
  const targets = {
    closingRateTarget: 0.15,
    maxClosingRate: 0.15,
    callConversionTarget: 0.7,
    qualifiedLeadsTarget: 50, // 0.75 * 100 for count
  }

  useEffect(() => {
    fetchCycles()
  }, [])

  useEffect(() => {
    if (activeCycle) {
      fetchAgentData()
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

  const fetchAgentData = async () => {
    if (!activeCycle || !session?.user?.name) return

    try {
      const res = await fetch(`/api/daily-inputs?cycleId=${activeCycle.id}`)
      const inputs = await res.json()

      const agentInputs = inputs.filter((input: DailyInput) => input.agentName === session.user?.name)

      if (agentInputs.length > 0) {
        const totalMessages = agentInputs.reduce((sum: number, input: DailyInput) => sum + input.messagesReceived, 0)
        const totalCalls = agentInputs.reduce((sum: number, input: DailyInput) => sum + input.callsDone, 0)
        const totalClosings = agentInputs.reduce((sum: number, input: DailyInput) => sum + input.closings, 0)
        const qualifiedLeadsCount = leads.length // Use actual leads count
        const avgResponseTime =
          agentInputs.reduce((sum: number, input: DailyInput) => sum + input.avgResponseTime, 0) / agentInputs.length

        const closingRate = totalMessages > 0 ? totalClosings / totalMessages : 0
        const callConversion = totalMessages > 0 ? totalCalls / totalMessages : 0

        // Calculate scores using targets
        const closingScore = Math.round((closingRate / targets.closingRateTarget) * 100)
        const callConvScore = Math.round((callConversion / targets.callConversionTarget) * 100)
        const responseScore = Math.round((20 / avgResponseTime) * 100)
        const qualLeadsScore = Math.round((qualifiedLeadsCount / targets.qualifiedLeadsTarget) * 100)
        const estimatedScore = Math.round((closingScore * 0.4 + callConvScore * 0.3 + responseScore * 0.15 + qualLeadsScore * 0.15) * 10) / 10

        setStats({
          totalMessages,
          totalCalls,
          totalClosings,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          closingRate: Math.round(closingRate * 1000) / 10,
          callConversion: Math.round(callConversion * 1000) / 10,
          estimatedScore,
          qualifiedLeadsCount,
        })

        setScores({
          closingScore,
          callConvScore,
          responseScore,
          qualLeadsScore,
          totalScore: Math.round(estimatedScore),
        })

        setRecentEntries(agentInputs.slice(0, 5))
      }
    } catch (error) {
      console.error("Failed to fetch agent data:", error)
    }
  }


  // Chart data
  const radarData = [
    {
      metric: 'معدل الإغلاق',
      value: scores.closingScore,
    },
    {
      metric: 'تحويل المكالمات',
      value: scores.callConvScore,
    },
    {
      metric: 'وقت الاستجابة',
      value: scores.responseScore,
    },
    {
      metric: 'العملاء المؤهلين',
      value: scores.qualLeadsScore,
    },
  ]

  const performanceChartData = [
    {
      name: 'أدائي',
      'الرسائل': stats.totalMessages,
      'المكالمات': stats.totalCalls,
      'الإغلاقات': stats.totalClosings,
      'العملاء_المؤهلين': stats.qualifiedLeadsCount,
    },
  ]

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
        <AgentSidebar />
        <div className="flex-1 flex flex-col">
          <NavbarAgent />
          <div className="flex items-center justify-center flex-1">
            <div className="text-gray-700">جاري التحميل...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <AgentSidebar />
      <div className="flex-1 flex flex-col">
        <NavbarAgent />
        
        <div className="flex-1 overflow-auto">
          <div className="">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-md">
              <div className="flex items-center gap-4 mb-2">
                <BarChart3 className="w-10 h-10" />
                <h1 className="text-4xl font-bold">لوحة أدائي</h1>
              </div>
              <p className="text-blue-100 text-lg">مرحباً بك، {session?.user?.name} - تتبع أدائك بشكل مباشر</p>
            </div>

            <div className="flex-1 overflow-auto p-4 lg:p-6">
              <div className="max-w-7xl mx-auto space-y-6">
                <CycleSelector cycles={cycles} activeCycle={activeCycle} onSelect={setActiveCycle} />

                {/* Top Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div className="grid grid-cols-2 grid-rows-2 gap-6 mb-8">
  <Card className="py-0 border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm font-semibold mb-1">إجمالي الرسائل</p>
          <p className="text-4xl font-bold">{performanceChartData.reduce((a, b) => a + b.الرسائل, 0)}</p>
        </div>
        <MessageCircle className="w-12 h-12 text-blue-200" />
      </div>
    </CardContent>
  </Card>

  <Card className="py-0 border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white transform hover:scale-105 transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-purple-100 text-sm font-semibold mb-1">إجمالي المكالمات</p>
          <p className="text-4xl font-bold">{performanceChartData.reduce((a, b) => a + b.المكالمات, 0)}</p>
        </div>
        <Phone className="w-12 h-12 text-purple-200" />
      </div>
    </CardContent>
  </Card>

  <Card className="py-0 border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white transform hover:scale-105 transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-emerald-100 text-sm font-semibold mb-1">إجمالي الإغلاقات</p>
          <p className="text-4xl font-bold">{performanceChartData.reduce((a, b) => a + b.الإغلاقات, 0)}</p>
        </div>
        <CheckCircle className="w-12 h-12 text-emerald-200" />
      </div>
    </CardContent>
  </Card>

  <Card className="py-0 border-0 shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white transform hover:scale-105 transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-amber-100 text-sm font-semibold mb-1">العملاء المؤهلين</p>
          <p className="text-4xl font-bold">{performanceChartData.reduce((a, b) => a + b.العملاء_المؤهلين, 0)}</p>
        </div>
        <Users className="w-12 h-12 text-amber-200" />
      </div>
    </CardContent>
  </Card>
</div>

                  {/* Radar Chart */}
                  <Card className="py-0 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
                      <CardTitle className="text-lg flex items-center gap-3 pt-3 pb-1">
                        <Target className="w-7 h-7" />
                        تحليل المؤشرات الفردية
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#d1d5db" strokeWidth={2} />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar name="أدائي" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} strokeWidth={2} />
                          <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 'bold' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Entries Table */}
                <Card className="py-0 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                    <CardTitle className="text-lg flex items-center gap-3 pt-3">
                      <Clock className="w-7 h-7" />
                      الإدخالات الأخيرة
                    </CardTitle>
                    <CardDescription className="text-blue-100 text-sm font-medium pb-2">آخر 5 إدخالات يومية</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto p-0">
                    {recentEntries.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-gray-100 to-slate-200 border-b-4 border-blue-500">
                          <tr>
                            <th className="px-6 py-5 text-right font-bold text-gray-900 text-sm">التاريخ</th>
                            <th className="px-4 py-2 text-center font-bold text-gray-700 text-sm">الرسائل</th>
                            <th className="px-4 py-2 text-center font-bold text-gray-700 text-sm">المكالمات</th>
                            <th className="px-4 py-2 text-center font-bold text-gray-700 text-sm">الإغلاقات</th>
                            <th className="px-4 py-2 text-center font-bold text-purple-700 text-sm">متوسط الاستجابة</th>
                            <th className="px-4 py-2 text-center font-bold text-amber-700 text-sm">العملاء المؤهلين</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentEntries.map((entry, idx) => (
                            <tr key={entry.id} className={`border-b-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 ${idx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                              <td className="px-6 py-5 font-bold text-gray-900 text-sm">
                                {new Date(entry.date).toLocaleDateString("ar-EG")}
                              </td>
                              <td className="px-4 py-2 text-center font-bold text-gray-700 text-sm">{entry.messagesReceived}</td>
                              <td className="px-4 py-2 text-center font-bold text-gray-700 text-sm">{entry.callsDone}</td>
                              <td className="px-4 py-2 text-center font-bold text-gray-700 text-sm">{entry.closings}</td>
                              <td className="px-4 py-2 text-center">
                                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 font-bold rounded-lg text-sm">
                                  {entry.avgResponseTime} د
                                </span>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 font-bold rounded-lg text-sm">
                                  {entry.qualifiedLeadsCount || 0}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-12 text-center">
                        <p className="text-gray-500 text-lg">لا توجد إدخالات حتى الآن في هذه الدورة</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Progress Bars */}
                <Card className="py-0 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <CardTitle className="text-lg flex items-center gap-3 pt-3">
                      <TrendingUp className="w-7 h-7" />
                      مؤشرات التقدم
                    </CardTitle>
                    <CardDescription className="text-indigo-100 text-sm font-medium pb-2">تقييم أدائك مقارنة بالأهداف</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-gray-700">معدل الإغلاق</span>
                        <span className="text-lg font-bold text-emerald-600">{stats.closingRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-green-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2" 
                          style={{ width: `${Math.min(stats.closingRate * 6.67, 100)}%` }}
                        >
                          {stats.closingRate > 2 && <span className="text-xs font-bold text-white">●</span>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">الهدف: 15%</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-gray-700">تحويل المكالمات</span>
                        <span className="text-lg font-bold text-blue-600">{stats.callConversion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2" 
                          style={{ width: `${Math.min(stats.callConversion * 1.43, 100)}%` }}
                        >
                          {stats.callConversion > 10 && <span className="text-xs font-bold text-white">●</span>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">الهدف: 70%</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-gray-700">وقت الاستجابة</span>
                        <span className="text-lg font-bold text-purple-600">{stats.avgResponseTime} دقيقة</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2" 
                          style={{ width: `${Math.min((20 / stats.avgResponseTime) * 100, 100)}%` }}
                        >
                          {stats.avgResponseTime < 30 && <span className="text-xs font-bold text-white">●</span>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">الهدف: أقل من 20 دقيقة</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-gray-700">العملاء المؤهلين</span>
                        <span className="text-lg font-bold text-amber-600">{stats.qualifiedLeadsCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-orange-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2" 
                          style={{ width: `${Math.min((stats.qualifiedLeadsCount / 50) * 100, 100)}%` }}
                        >
                          {stats.qualifiedLeadsCount > 5 && <span className="text-xs font-bold text-white">●</span>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">الهدف: 50 عميل</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Motivational Card */}
                <Card className="py-0 border-0 shadow-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full -ml-20 -mb-20"></div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">أداء رائع! 🎉</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          أنت تحقق نتائج ممتازة. استمر في العمل الجاد وحافظ على هذا المستوى المتميز من الأداء. 
                          كل جهد تبذله يساهم في نجاح الفريق بأكمله.
                        </p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-200 shadow-sm">
                            <span className="text-sm font-semibold text-blue-700">💪 قوة الأداء</span>
                          </div>
                          <div className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-indigo-200 shadow-sm">
                            <span className="text-sm font-semibold text-indigo-700">🚀 في تقدم مستمر</span>
                          </div>
                          <div className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-200 shadow-sm">
                            <span className="text-sm font-semibold text-purple-700">⭐ عمل متميز</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
                