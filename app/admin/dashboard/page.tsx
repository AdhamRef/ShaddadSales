"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Navbar from "@/components/navbar"
import AdminSidebar from "@/components/admin-sidebar"
import CycleSelector from "@/components/cycle-selector"
import { Settings, TrendingUp, Trophy, Target, BarChart3, Phone, MessageCircle, CheckCircle, Users, Award } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from "recharts"

interface Cycle {
  id: string
  name: string
  month: number
  year: number
  isActive: boolean
  kpiConfig?: {
    closingRateWeight: number
    callConversionWeight: number
    responseTimeWeight: number
    qualifiedLeadsWeight: number
    closingRateTarget: number
    maxClosingRate: number
    callConversionTarget: number
    qualifiedLeadsTarget: number
  }
}

interface DailyInput {
  id: string
  agentName: string
  messagesReceived: number
  callsDone: number
  closings: number
  avgResponseTime: number
}

interface QualifiedLead {
  id: string
  agentName: string
}

interface AgentPerformance {
  agentName: string
  totalMessages: number
  totalCalls: number
  totalClosings: number
  avgResponseTime: number
  qualifiedLeadsCount: number
  closingRate: number
  callConversion: number
  qualifiedLeadsRate: number
}

interface KPIScore {
  agentName: string
  closingScore: number
  callConvScore: number
  responseScore: number
  qualLeadsScore: number
  totalScore: number
}

const AGENTS = ["Rahma", "Yomna", "Menna"]

export default function KPICalculator() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null)
  const [weights, setWeights] = useState({
    closingRate: 0.4,
    callConversion: 0.3,
    responseTime: 0.15,
    qualifiedLeads: 0.15,
  })
  const [targets, setTargets] = useState({
    closingRate: 0.15,
    maxClosingRate: 0.15,
    callConversion: 0.7,
    qualifiedLeads: 0.75,
  })
  const [performances, setPerformances] = useState<AgentPerformance[]>([])
  const [scores, setScores] = useState<KPIScore[]>([])
  const [rankings, setRankings] = useState<(KPIScore & { rank: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [editingWeights, setEditingWeights] = useState(false)

  useEffect(() => {
    fetchCycles()
  }, [])

  useEffect(() => {
    if (activeCycle) {
      fetchKPIConfig()
      calculatePerformance()
    }
  }, [activeCycle])

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

  const fetchKPIConfig = async () => {
    if (!activeCycle?.kpiConfig) return

    setWeights({
      closingRate: activeCycle.kpiConfig.closingRateWeight,
      callConversion: activeCycle.kpiConfig.callConversionWeight,
      responseTime: activeCycle.kpiConfig.responseTimeWeight,
      qualifiedLeads: activeCycle.kpiConfig.qualifiedLeadsWeight,
    })

    setTargets({
      closingRate: activeCycle.kpiConfig.closingRateTarget,
      maxClosingRate: activeCycle.kpiConfig.maxClosingRate,
      callConversion: activeCycle.kpiConfig.callConversionTarget,
      qualifiedLeads: activeCycle.kpiConfig.qualifiedLeadsTarget,
    })
  }

  const calculatePerformance = async () => {
    if (!activeCycle) return

    try {
      const dailyInputsRes = await fetch(`/api/daily-inputs?cycleId=${activeCycle.id}`)
      const dailyInputs = await dailyInputsRes.json()

      const leadsRes = await fetch(`/api/qualified-leads?cycleId=${activeCycle.id}`)
      const leads = await leadsRes.json()

      const performanceMap: { [key: string]: AgentPerformance } = {}

      AGENTS.forEach((agent) => {
        performanceMap[agent] = {
          agentName: agent,
          totalMessages: 0,
          totalCalls: 0,
          totalClosings: 0,
          avgResponseTime: 0,
          qualifiedLeadsCount: 0,
          closingRate: 0,
          callConversion: 0,
          qualifiedLeadsRate: 0,
        }
      })

      dailyInputs.forEach((input: DailyInput) => {
        if (performanceMap[input.agentName]) {
          performanceMap[input.agentName].totalMessages += input.messagesReceived
          performanceMap[input.agentName].totalCalls += input.callsDone
          performanceMap[input.agentName].totalClosings += input.closings
          performanceMap[input.agentName].avgResponseTime += input.avgResponseTime
        }
      })

      dailyInputs.forEach((input: DailyInput) => {
        const agentInputs = dailyInputs.filter((d: DailyInput) => d.agentName === input.agentName)
        if (performanceMap[input.agentName]) {
          performanceMap[input.agentName].avgResponseTime = performanceMap[input.agentName].avgResponseTime / agentInputs.length
        }
      })

      leads.forEach((lead: QualifiedLead) => {
        if (performanceMap[lead.agentName]) {
          performanceMap[lead.agentName].qualifiedLeadsCount += 1
        }
      })

      Object.keys(performanceMap).forEach((agent) => {
        const perf = performanceMap[agent]
        if (perf.totalMessages > 0) {
          perf.closingRate = perf.totalClosings / perf.totalMessages
          perf.callConversion = perf.totalCalls / perf.totalMessages
          perf.qualifiedLeadsRate = perf.qualifiedLeadsCount / perf.totalMessages
        }
      })

      const perfArray = Object.values(performanceMap)
      setPerformances(perfArray)

      calculateScores(perfArray)
    } catch (error) {
      console.error("Failed to calculate performance:", error)
    }
  }

const calculateScores = (perf: AgentPerformance[]) => {
    // Find the best (lowest) response time
    const validResponseTimes = perf.map((p) => p.avgResponseTime).filter((t) => t > 0)
    const bestResponseTime = validResponseTimes.length > 0 ? Math.min(...validResponseTimes) : 1

    const kpiScores: KPIScore[] = perf.map((p) => {
      const closingScore = (p.closingRate / targets.maxClosingRate) * 100
      const callConvScore = (p.callConversion / targets.callConversion) * 100
      
      // New calculation: best agent gets 100, others are scaled proportionally
      // If agent has best time, they get 100. Otherwise: (bestTime / agentTime) * 100
      const responseScore = p.avgResponseTime > 0 
        ? (bestResponseTime / p.avgResponseTime) * 100 
        : 0
      
      const qualLeadsScore = (p.qualifiedLeadsRate / targets.qualifiedLeads) * 100

      const totalScore =
        closingScore * weights.closingRate +
        callConvScore * weights.callConversion +
        responseScore * weights.responseTime +
        qualLeadsScore * weights.qualifiedLeads

      return {
        agentName: p.agentName,
        closingScore: Math.round(closingScore * 10) / 10,
        callConvScore: Math.round(callConvScore * 10) / 10,
        responseScore: Math.round(responseScore * 10) / 10,
        qualLeadsScore: Math.round(qualLeadsScore * 10) / 10,
        totalScore: Math.round(totalScore * 10) / 10,
      }
    })

    setScores(kpiScores)

    const rankedScores = kpiScores
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((score, index) => ({ ...score, rank: index + 1 }))

    setRankings(rankedScores)
  }

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights({ ...weights, [key]: value })
  }

  const handleTargetChange = (key: keyof typeof targets, value: number) => {
    setTargets({ ...targets, [key]: value })
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

  // Prepare chart data
  const radarData = scores.map(s => ({
    agent: s.agentName,
    'معدل الإغلاق': s.closingScore,
    'تحويل المكالمات': s.callConvScore,
    'وقت الاستجابة': s.responseScore,
    'العملاء المؤهلين': s.qualLeadsScore,
  }))

  const barChartData = rankings.map(r => ({
    name: r.agentName,
    النتيجة: r.totalScore,
  }))

  const performanceChartData = performances.map(p => ({
    name: p.agentName,
    الرسائل: p.totalMessages,
    المكالمات: p.totalCalls,
    الإغلاقات: p.totalClosings,
    'العملاء المؤهلين': p.qualifiedLeadsCount,
  }))

  const radarDataAgent1 = scores.length > 0 ? [
  { metric: 'معدل الإغلاق', value: scores[0].closingScore },
  { metric: 'تحويل المكالمات', value: scores[0].callConvScore },
  { metric: 'وقت الاستجابة', value: scores[0].responseScore },
  { metric: 'العملاء المؤهلين', value: scores[0].qualLeadsScore },
] : []

const radarDataAgent2 = scores.length > 1 ? [
  { metric: 'معدل الإغلاق', value: scores[1].closingScore },
  { metric: 'تحويل المكالمات', value: scores[1].callConvScore },
  { metric: 'وقت الاستجابة', value: scores[1].responseScore },
  { metric: 'العملاء المؤهلين', value: scores[1].qualLeadsScore },
] : []

const radarDataAgent3 = scores.length > 2 ? [
  { metric: 'معدل الإغلاق', value: scores[2].closingScore },
  { metric: 'تحويل المكالمات', value: scores[2].callConvScore },
  { metric: 'وقت الاستجابة', value: scores[2].responseScore },
  { metric: 'العملاء المؤهلين', value: scores[2].qualLeadsScore },
] : []

const performanceFullBarChartData = [
    scores[2] && {
    name: scores[2].agentName,
    الرسائل: scores[2].responseScore,
    المكالمات: scores[2].callConvScore,
    الإغلاقات: scores[2].closingScore,
    العملاء: scores[2].qualLeadsScore,
  },
    scores[1] && {
    name: scores[1].agentName,
    الرسائل: scores[1].responseScore,
    المكالمات: scores[1].callConvScore,
    الإغلاقات: scores[1].closingScore,
    العملاء: scores[1].qualLeadsScore,
  },

  scores[0] && {
    name: scores[0].agentName,
    الرسائل: scores[0].responseScore,
    المكالمات: scores[0].callConvScore,
    الإغلاقات: scores[0].closingScore,
    العملاء: scores[0].qualLeadsScore,
  },

].filter(Boolean)


function capRadarData(data) {
  return data.map((item) => ({
    ...item,
    value: Math.min(item.value, 100),
  }));
}


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-semibold">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
 
        <div className="flex-1 overflow-auto">
          <div className="">
            {/* Header */}
                   <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-md stat">
              <div className="flex items-center gap-4 mb-2">
                <BarChart3 className="w-10 h-10" />
                <h1 className="text-4xl font-bold">لوحة الإحصائيات</h1>
              </div>
              <p className="text-blue-100 text-lg">تتبع وتحليل أداء الفريق بشكل مباشر</p>
            </div>
 <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <CycleSelector cycles={cycles} activeCycle={activeCycle} onSelect={setActiveCycle} />



            {rankings.length > 0 && (
              <>


                    <div className="min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="py-0 border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-semibold mb-1">إجمالي الرسائل</p>
                  <p className="text-4xl font-bold">{performances.reduce((a, b) => a + b.totalMessages, 0)}</p>
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
                  <p className="text-4xl font-bold">{performances.reduce((a, b) => a + b.totalCalls, 0)}</p>
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
                  <p className="text-4xl font-bold">{performances.reduce((a, b) => a + b.totalClosings, 0)}</p>
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
                  <p className="text-4xl font-bold">{performances.reduce((a, b) => a + b.qualifiedLeadsCount, 0)}</p>
                </div>
                <Users className="w-12 h-12 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

                       {/* Performance Summary Table */}
        <Card className="py-0 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardTitle className="text-lg flex items-center gap-3 pt-3">
              <TrendingUp className="w-7 h-7" />
              ملخص الأداء
            </CardTitle>
            <CardDescription className="text-indigo-100 text-sm font-medium pb-2">المقاييس الأولية المستخدمة في الحسابات</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-100 to-slate-200 border-b-4 border-indigo-500">
                <tr>
                  <th className="px-6 py-5 text-right font-bold text-gray-900 text-sm">الموظف</th>
                  <th className="px-4 py-2 text-center font-bold text-gray-700 text-sm">الرسائل</th>
                  <th className="px-4 py-2 text-center font-bold text-gray-700 text-sm">المكالمات</th>
                  <th className="px-4 py-2 text-center font-bold text-gray-700 text-sm">الإغلاقات</th>
                  <th className="px-4 py-2 text-center font-bold text-emerald-700 text-sm">نسبة الإغلاق</th>
                  <th className="px-4 py-2 text-center font-bold text-blue-700 text-sm">نسبة تحويل المكالمات</th>
                  <th className="px-4 py-2 text-center font-bold text-purple-700 text-sm">متوسط الاستجابة</th>
                  <th className="px-4 py-2 text-center font-bold text-amber-700 text-sm">العملاء المؤهلين</th>
                </tr>
              </thead>
              <tbody>
                {performances.map((perf, idx) => (
                  <tr key={perf.agentName} className={`border-b-2 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 ${idx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                    <td className="px-6 py-5 font-bold text-gray-900 text-sm">{perf.agentName}</td>
                    <td className="px-4 py-2 text-center font-bold text-gray-700 text-sm">{perf.totalMessages}</td>
                    <td className="px-4 py-2 text-center font-bold text-gray-700 text-sm">{perf.totalCalls}</td>
                    <td className="px-4 py-2 text-center font-bold text-gray-700 text-sm">{perf.totalClosings}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-sm">
                        {Math.round(perf.closingRate * 1000) / 10}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-lg text-sm">
                        {Math.round(perf.callConversion * 1000) / 10}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 font-bold rounded-lg text-sm">
                        {Math.round(perf.avgResponseTime * 10) / 10} د
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 font-bold rounded-lg text-sm">
                        {perf.qualifiedLeadsCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Detailed Scores Table */}
        <Card className="py-0 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardTitle className="text-lg flex items-center gap-3 pt-3">
              <Award className="w-7 h-7" />
              السكور التفصيلي
            </CardTitle>
            <CardDescription className="text-blue-100 text-sm font-medium pb-2">درجات مؤشرات الأداء الفردية لكل موظف</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-100 to-slate-200 border-b-4 border-blue-500">
                <tr>
                  <th className="px-6 py-5 text-right font-bold text-gray-900 text-sm">الموظف</th>
                  <th className="px-4 py-2 text-center font-bold text-emerald-700 text-sm">معدل الإغلاق</th>
                  <th className="px-4 py-2 text-center font-bold text-blue-700 text-sm">تحويل المكالمات</th>
                  <th className="px-4 py-2 text-center font-bold text-purple-700 text-sm">وقت الاستجابة</th>
                  <th className="px-4 py-2 text-center font-bold text-amber-700 text-sm">العملاء المؤهلين</th>
                  <th className="px-4 py-2 text-center font-bold text-blue-700 text-sm">النتيجة الإجمالية</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score, idx) => (
                  <tr key={score.agentName} className={`border-b-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${idx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                    <td className="px-6 py-5 font-bold text-gray-900 text-sm">{score.agentName}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-full text-sm">
                        {score.closingScore}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">
                        {score.callConvScore}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-full text-sm">
                        {score.responseScore}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-4 py-2 bg-amber-100 text-amber-700 font-bold rounded-full text-sm">
                        {score.qualLeadsScore}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full text-sm shadow-lg">
                        {score.totalScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

                        {/* Rankings Card */}
                <Card className="bg-white border border-gray-200 shadow-lg overflow-hidden py-0">
                  <CardHeader className="!pb-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-gray-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4 mt-4 mb-2">
                        <div className="bg-gradient-to-br from-amber-400 to-yellow-500 p-3 rounded-xl shadow-lg">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-xl text-white font-bold tracking-tight">تصنيف الأداء</CardTitle>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm px-4 py-2 mt-2 rounded-lg border border-white/20">
                        <span className="text-white/80 text-sm font-medium">أفضل 3 وكلاء</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 bg-gradient-to-b from-gray-50 to-white">
                    <div className="space-y-4">
                      {rankings.map((rank, index) => (
                        <div
                          key={rank.agentName}
                          className="group relative"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className={`
                            relative flex justify-between items-center p-6 rounded-2xl
                            transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                            ${rank.rank === 1
                              ? "bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-300 shadow-lg shadow-amber-100"
                              : rank.rank === 2
                                ? "bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-2 border-gray-300 shadow-lg shadow-gray-100"
                                : "bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-300 shadow-lg shadow-orange-100"
                            }
                          `}>
                            {/* Rank Badge */}
                            <div className="absolute -top-3 -right-3 z-10">
                              <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg
                                ${rank.rank === 1
                                  ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white"
                                  : rank.rank === 2
                                    ? "bg-gradient-to-br from-gray-400 to-slate-500 text-white"
                                    : "bg-gradient-to-br from-orange-400 to-amber-500 text-white"
                                }
                              `}>
                                #{rank.rank}
                              </div>
                            </div>

                            <div className="flex items-center gap-5 flex-1">
                              {/* Medal Icon */}
                              <div className={`
                                flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-4xl
                                ${rank.rank === 1
                                  ? "bg-gradient-to-br from-amber-200 to-yellow-300"
                                  : rank.rank === 2
                                    ? "bg-gradient-to-br from-gray-200 to-slate-300"
                                    : "bg-gradient-to-br from-orange-200 to-amber-300"
                                }
                              `}>
                                {rank.rank === 1 ? "🥇" : rank.rank === 2 ? "🥈" : "🥉"}
                              </div>

                              {/* Agent Info */}
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{rank.agentName}</h3>
                                <div className="flex items-center gap-3">
                                  <span className={`
                                    px-3 py-1 rounded-full text-xs font-semibold
                                    ${rank.rank === 1
                                      ? "bg-amber-200 text-amber-900"
                                      : rank.rank === 2
                                        ? "bg-gray-200 text-gray-900"
                                        : "bg-orange-200 text-orange-900"
                                    }
                                  `}>
                                    المرتبة {rank.rank}
                                  </span>
                                  <span className="text-gray-500 text-sm">●</span>
                                  <span className="text-gray-600 text-sm font-medium">أداء متميز</span>
                                </div>
                              </div>
                            </div>

                            {/* Score Display */}
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-baseline gap-2">
                                <span className={`
                                  text-5xl font-bold tracking-tight
                                  ${rank.rank === 1
                                    ? "bg-gradient-to-br from-amber-600 to-yellow-600 bg-clip-text text-transparent"
                                    : rank.rank === 2
                                      ? "bg-gradient-to-br from-gray-600 to-slate-700 bg-clip-text text-transparent"
                                      : "bg-gradient-to-br from-orange-600 to-amber-600 bg-clip-text text-transparent"
                                  }
                                `}>
                                  {rank.totalScore}
                                </span>
                                <span className="text-gray-500 text-sm font-semibold mb-2">نقطة</span>
                              </div>
                              <div className="flex items-center gap-1 text-green-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-semibold">في تقدم</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

        {/*
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
     
          <Card className="py-0 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-3 pt-3 pb-1">
                <BarChart3 className="w-7 h-7" />
                مقارنة النتائج الإجمالية
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1e40af" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#4b5563" style={{ fontSize: '14px', fontWeight: 'bold' }} />
                  <YAxis stroke="#4b5563" />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #3b82f6', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="النتيجة" fill="url(#barGradient)" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div> */}


        {/* Individual Metric Charts - 3 Radar Charts for Each Agent */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* Agent 1 - Gold */}
  {scores.length > 0 && (
    <Card className="py-0 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-t-lg">
        <CardTitle className="text-lg flex items-center gap-3 pt-3 pb-1">
          <Target className="w-7 h-7" />
          {scores[0].agentName} - تحليل المؤشرات 🥇
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={capRadarData(radarDataAgent1)}>
            <PolarGrid stroke="#d1d5db" strokeWidth={2} />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Radar name={scores[0].agentName} dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.7} strokeWidth={2} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #f59e0b', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )}

  {/* Agent 2 - Silver */}
  {scores.length > 1 && (
    <Card className="py-0 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-t-lg">
        <CardTitle className="text-lg flex items-center gap-3 pt-3 pb-1">
          <Target className="w-7 h-7" />
          {scores[1].agentName} - تحليل المؤشرات 🥈
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={capRadarData(radarDataAgent2)}>
            <PolarGrid stroke="#d1d5db" strokeWidth={2} />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Radar name={scores[1].agentName} dataKey="value" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.7} strokeWidth={2} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #9ca3af', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )}

  {/* Agent 3 - Bronze */}
  {scores.length > 2 && (
    <Card className="py-0 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-amber-700 to-yellow-700 text-white rounded-t-lg">
        <CardTitle className="text-lg flex items-center gap-3 pt-3 pb-1">
          <Target className="w-7 h-7" />
          {scores[2].agentName} - تحليل المؤشرات 🥉
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={capRadarData(radarDataAgent3)}>
            <PolarGrid stroke="#d1d5db" strokeWidth={2} />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Radar name={scores[2].agentName} dataKey="value" stroke="#b45309" fill="#b45309" fillOpacity={0.7} strokeWidth={2} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #b45309', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )}

</div>


        {/* Performance Metrics Chart */}
        <Card className="py-0 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-3 pt-3 pb-1">
              <TrendingUp className="w-7 h-7" />
              مقاييس الأداء الرئيسية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={performanceFullBarChartData}>
                <defs>
                  <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1e40af" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="callGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="closeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#4b5563" style={{ fontSize: '14px', fontWeight: 'bold' }} />
                <YAxis stroke="#4b5563" />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #10b981', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }} />
                <Bar dataKey="الرسائل" fill="url(#msgGradient)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="المكالمات" fill="url(#callGradient)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="الإغلاقات" fill="url(#closeGradient)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="العملاء" fill="url(#leadGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>



 
      </div>
    </div>
    
              </>
            )}
                        {/* KPI Configuration Card */}
            <Card className="bg-white py-0 shadow-none">
              <CardHeader className="py-2 bg-white border-b-2 border-blue-100">
                <div className="flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg text-gray-900">إعدادات مؤشرات الأداء</CardTitle>
                      <CardDescription className="text-sm">تعديل الأوزان والأهداف للدورة الحالية</CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingWeights(!editingWeights)
                      if (editingWeights) {
                        calculatePerformance()
                      }
                    }}
                    className={`${editingWeights ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50'} transition-all duration-200`}
                    variant={editingWeights ? "default" : "outline"}
                  >
                    <Settings className="w-5 h-5 ml-2" />
                    {editingWeights ? 'حفظ التعديلات' : 'تعديل الإعدادات'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {editingWeights && (
                  <div className="space-y-8">
                    <div className="bg-blue-50 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-6">
                        <Target className="w-6 h-6 text-blue-600" />
                        <h3 className="font-bold text-xl text-gray-900">
                          أوزان المؤشرات (الإجمالي: {Math.round(totalWeight * 100)}%)
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { key: 'closingRate' as keyof typeof weights, label: 'معدل الإغلاق', color: 'emerald' },
                          { key: 'callConversion' as keyof typeof weights, label: 'تحويل المكالمات', color: 'blue' },
                          { key: 'responseTime' as keyof typeof weights, label: 'وقت الاستجابة', color: 'purple' },
                          { key: 'qualifiedLeads' as keyof typeof weights, label: 'العملاء المؤهلين', color: 'amber' }
                        ].map(({ key, label, color }) => (
                          <div key={key} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-3">{label}</label>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                step="0.01"
                                value={weights[key]}
                                onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                                className="w-28 text-lg font-semibold"
                              />
                              <span className={`text-xl font-bold text-${color}-600 bg-${color}-50 px-4 py-2 rounded-lg`}>
                                {Math.round(weights[key] * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                        <h3 className="font-bold text-xl text-gray-900">أهداف الأداء</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { key: 'closingRate' as keyof typeof targets, label: 'هدف معدل الإغلاق' },
                          { key: 'maxClosingRate' as keyof typeof targets, label: 'أقصى معدل إغلاق (للحصول على 100%)' },
                          { key: 'callConversion' as keyof typeof targets, label: 'هدف تحويل المكالمات' },
                          { key: 'qualifiedLeads' as keyof typeof targets, label: 'هدف العملاء المؤهلين' }
                        ].map(({ key, label }) => (
                          <div key={key} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-3">{label}</label>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                step="0.01"
                                value={targets[key]}
                                onChange={(e) => handleTargetChange(key, parseFloat(e.target.value))}
                                className="w-28 text-lg font-semibold"
                              />
                              <span className="text-xl font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg">
                                {Math.round(targets[key] * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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