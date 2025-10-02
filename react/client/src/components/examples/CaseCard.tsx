import { CaseCard } from '../CaseCard'

export default function CaseCardExample() {
  return (
    <CaseCard
      id="1"
      title="Acute Myocardial Infarction"
      specialty="Internal Medicine"
      difficulty="Advanced"
      duration="45 min"
      completionRate={65}
    />
  )
}
