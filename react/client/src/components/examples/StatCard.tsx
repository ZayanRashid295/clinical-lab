import { StatCard } from '../StatCard'
import { BookOpen } from 'lucide-react'

export default function StatCardExample() {
  return (
    <StatCard
      title="Cases Completed"
      value={47}
      icon={BookOpen}
      trend={{ value: 12, label: "this month" }}
    />
  )
}
