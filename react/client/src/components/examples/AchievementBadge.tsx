import { AchievementBadge } from '../AchievementBadge'
import { Heart } from 'lucide-react'

export default function AchievementBadgeExample() {
  return (
    <div className="space-y-4">
      <AchievementBadge
        icon={Heart}
        title="Sepsis Bundle Hero"
        description="Successfully managed 10 sepsis cases following evidence-based guidelines"
        unlocked={true}
      />
      <AchievementBadge
        icon={Heart}
        title="ECG Master"
        description="Correctly interpret 50 ECGs"
        unlocked={false}
      />
    </div>
  )
}
