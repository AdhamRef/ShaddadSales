"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

export default function DataEntryTable({
  inputs,
  onEdit,
  onDelete,
}: {
  inputs: DailyInput[]
  onEdit: (input: DailyInput) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>جميع الإدخالات</CardTitle>
        <CardDescription>{inputs.length} إدخالات إجمالية</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2 text-right font-semibold">التاريخ</th>
              <th className="px-4 py-2 text-right font-semibold">الوكيل</th>
              <th className="px-4 py-2 text-right font-semibold">الرسائل</th>
              <th className="px-4 py-2 text-right font-semibold">المكالمات</th>
              <th className="px-4 py-2 text-right font-semibold">الإغلاقات</th>
              <th className="px-4 py-2 text-right font-semibold">متوسط الاستجابة (دقائق)</th>
              <th className="px-4 py-2 text-right font-semibold">ملاحظات</th>
              <th className="px-4 py-2 text-center font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {inputs.length > 0 ? (
              inputs.map((input, index) => (
                <tr
                  key={input.id}
                  className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <td className="px-4 py-3">{new Date(input.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium">{input.agentName}</td>
                  <td className="px-4 py-3 text-right">{input.messagesReceived}</td>
                  <td className="px-4 py-3 text-right">{input.callsDone}</td>
                  <td className="px-4 py-3 text-right">{input.closings}</td>
                  <td className="px-4 py-3 text-right">{input.avgResponseTime}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{input.notes?.substring(0, 20)}...</td>
                  <td className="px-4 py-3 text-center flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => onEdit(input)}>
                      تعديل
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  لا توجد إدخالات بعد. أضف أول إدخال يومي أعلاه.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
