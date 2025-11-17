"use client"

import { Card, CardContent } from "@/components/ui/card"
import clsx from "clsx"

interface Cycle {
  id: string
  name: string
  month: number
  year: number
  isActive: boolean
}

interface CycleSelectorProps {
  cycles: Cycle[]
  activeCycle: Cycle | null
  onSelect: (cycle: Cycle) => void
}

export default function CycleSelector({ cycles, activeCycle, onSelect }: CycleSelectorProps) {
  return (
    <Card className="w-full py-2 shadow-none">
      <CardContent className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <span className="text-sm font-medium text-gray-600">سبرينت:</span>
        <div className="flex flex-wrap gap-2">
          {cycles.length ? (
            cycles.map((cycle) => (
              <button
                key={cycle.id}
                onClick={() => onSelect(cycle)}
                className={clsx(
                  "text-xs px-3 py-1 rounded-full font-medium transition-colors duration-200",
                  activeCycle?.id === cycle.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {cycle.name}
              </button>
            ))
          ) : (
            <p className="text-xs text-gray-400">No cycles yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
