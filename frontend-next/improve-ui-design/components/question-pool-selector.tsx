"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sparkles, XCircle, CircleDashed, CheckCircle, Loader2 } from "lucide-react"

interface QuestionPool {
  id: string
  label: string
  count: number
  icon: React.ReactNode
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
    { id: "unused", label: "Unused", count: stats?.unused ?? 0, icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "incorrect", label: "Incorrect", count: stats?.incorrect ?? 0, icon: <XCircle className="h-3.5 w-3.5" /> },
    { id: "omitted", label: "Omitted", count: stats?.omitted ?? 0, icon: <CircleDashed className="h-3.5 w-3.5" /> },
    { id: "correct", label: "Correct", count: stats?.correct ?? 0, icon: <CheckCircle className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="bg-card rounded-lg border border-border" data-testid="card-question-pool">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Question Pool</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {loading ? "..." : `${stats?.total.toLocaleString()} total`}
        </span>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {pools.map((pool) => {
              const isSelected = selectedPool === pool.id
              return (
                <button
                  key={pool.id}
                  onClick={() => onPoolChange(pool.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-left transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`checkbox-${pool.id}`}
                >
                  {pool.icon}
                  <span className="text-sm font-medium flex-1">{pool.label}</span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${isSelected ? "text-primary-foreground/80" : ""}`}
                  >
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
