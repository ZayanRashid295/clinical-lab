import { FeatureSlider } from '../FeatureSlider'

export default function FeatureSliderExample() {
  const features = [
    {
      title: "AI Patient Simulations",
      description: "Practice clinical interviews with realistic AI patients that respond naturally to your questions and adapt to your approach.",
      highlights: [
        "Natural language conversations",
        "Realistic patient responses",
        "Multiple difficulty levels",
      ],
    },
    {
      title: "Shadow Mode Learning",
      description: "Observe expert AI doctors conducting patient interviews and learn from their clinical reasoning.",
      highlights: [
        "Watch AI doctor-patient interactions",
        "Ask questions anytime",
        "Highlighted teachable moments",
      ],
    },
  ];

  return <FeatureSlider features={features} />
}
