import { HeroCarousel } from '../HeroCarousel'

export default function HeroCarouselExample() {
  const slides = [
    {
      title: "Revolutionize Medical Education with AI",
      subtitle: "Practice clinical interviews, shadow AI doctors, and receive OSCE-style assessments.",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200",
      ctaPrimary: "Get Started",
      ctaSecondary: "Watch Demo",
    },
  ];

  return <HeroCarousel slides={slides} />
}
