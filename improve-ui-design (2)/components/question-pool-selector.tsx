"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sparkles, XCircle, CircleDashed, CheckCircle, Loader2, Layers } from "lucide-react"

interface QuestionPool {
  id: string
  label: string
  count: number
  icon: React.ReactNode
  color: string
  selectedColor: string
}

interface QuestionPoolSelectorProps {
  selectedPool: string
  onPoolChange: (pool: string) => void
  filters?: {
    tagIds?: string[]
    systemIds?: string[]
    subjectIds?: string[]
    topicIds?: string[]
  }
  refreshTrigger?: number
}

const mockStats = {
  unused: 1250,
  incorrect: 342,
  omitted: 156,
  correct: 567,
  total: 2404,
}

export function QuestionPoolSelector({
  selectedPool,
  onPoolChange,
  filters,
  refreshTrigger,
}: QuestionPoolSelectorProps) {
  const [stats, setStats] = useState<typeof mockStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 300))
      setStats(mockStats)
      setLoading(false)
    }
    fetchStats()
  }, [refreshTrigger])

  const pools: QuestionPool[] = [
    {
      id: "unused",
      label: "Unused",
      count: stats?.unused ?? 0,
      icon: <Sparkles className="h-3.5 w-3.5" />,
      color: "text-blue-400 bg-blue-500/10",
      selectedColor: "bg-blue-500 text-white",
    },
    {
      id: "correct",
      label: "Correct",
      count: stats?.correct ?? 0,
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      color: "text-emerald-400 bg-emerald-500/10",
      selectedColor: "bg-emerald-500 text-white",
    },
    {
      id: "incorrect",
      label: "Incorrect",
      count: stats?.incorrect ?? 0,
      icon: <XCircle className="h-3.5 w-3.5" />,
      color: "text-red-400 bg-red-500/10",
      selectedColor: "bg-red-500 text-white",
    },
    {
      id: "omitted",
      label: "Omitted",
      count: stats?.omitted ?? 0,
      icon: <CircleDashed className="h-3.5 w-3.5" />,
      color: "text-amber-400 bg-amber-500/10",
      selectedColor: "bg-amber-500 text-white",
    },
  ]

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden" data-testid="card-question-pool">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Question Pool</h3>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {loading ? "..." : `${stats?.total.toLocaleString()} total`}
        </span>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {pools.map((pool) => {
              const isSelected = selectedPool === pool.id
              return (
                <button
                  key={pool.id}
                  onClick={() => onPoolChange(pool.id)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg text-center transition-all ${
                    isSelected
                      ? pool.selectedColor + " shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`checkbox-${pool.id}`}
                >
                  <div className={`p-1 rounded ${isSelected ? "bg-white/20" : pool.color}`}>{pool.icon}</div>
                  <span className="text-[11px] font-medium">{pool.label}</span>
                  <span className={`text-sm font-bold tabular-nums ${isSelected ? "" : "text-foreground"}`}>
                    {pool.count.toLocaleString()}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
