import { PricingCard } from '../PricingCard'

export default function PricingCardExample() {
  return (
    <PricingCard
      name="Student Plan"
      price="$19"
      period="month"
      description="Perfect for individual medical students"
      features={[
        "Unlimited case access",
        "Shadow & Interview modes",
        "AI-powered feedback",
        "Leaderboard participation"
      ]}
      popular={true}
      cta="Start Free Trial"
      onSelect={() => console.log('Student plan selected')}
    />
  )
}
