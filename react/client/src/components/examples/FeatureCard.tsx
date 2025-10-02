import { FeatureCard } from '../FeatureCard'
import { Brain } from 'lucide-react'

export default function FeatureCardExample() {
  return (
    <FeatureCard 
      icon={Brain}
      title="AI-Powered Learning"
      description="Practice with realistic AI patients that adapt to your clinical decisions."
    />
  )
}
