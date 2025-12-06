// Types for the Choice system

export interface Choice {
  label: string
  text: string
  correct: boolean
  value?: string
}

export interface ChoiceManagerData {
  choices: Choice[]
  explanations: Record<string, any[]> // ContentBlock[] from rich-editor
}

export interface ChoiceManagerProps {
  initialChoices?: Choice[]
  initialExplanations?: Record<string, any[]>
  onChange: (data: ChoiceManagerData) => void
  disabled?: boolean
}































