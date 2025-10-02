"use client";

import { useState } from "react";
import { LandingNav } from "./LandingNav";
import { HeroCarousel } from "./HeroCarousel";
import { FeatureCard } from "./FeatureCard";
import { PricingCard } from "./PricingCard";
import { LoginModal } from "./LoginModal";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Users,
  BarChart3,
  Award,
  Target,
  Zap,
  Shield,
  Clock,
  Check,
} from "lucide-react";

// Placeholder images - you can replace these with actual images
const heroImage =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=600&fit=crop";
const studentPracticeImage =
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=600&fit=crop";
const facultyAnalyticsImage =
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200&h=600&fit=crop";

function FeaturesGrid() {
  const features = [
    {
      icon: Brain,
      title: "AI Patient Simulations",
      description:
        "Practice with realistic AI patients that respond naturally to your clinical approach",
    },
    {
      icon: Target,
      title: "Shadow Mode",
      description:
        "Learn by observing AI doctor-patient interactions with teachable moments highlighted",
    },
    {
      icon: BarChart3,
      title: "OSCE-Style Assessment",
      description:
        "Receive detailed rubric-based feedback aligned with medical competencies",
    },
    {
      icon: Award,
      title: "Gamification",
      description:
        "Track progress with leaderboards, Elo ratings, and specialty-specific achievements",
    },
    {
      icon: Zap,
      title: "Instant Feedback",
      description:
        "Get real-time guidance on clinical decisions and communication skills",
    },
    {
      icon: Users,
      title: "Faculty Oversight",
      description:
        "Comprehensive analytics and cohort management for institutions",
    },
    {
      icon: Shield,
      title: "Evidence-Based",
      description:
        "Cases anchored to clinical guidelines and validated by medical experts",
    },
    {
      icon: Clock,
      title: "24/7 Access",
      description: "Practice anytime, anywhere with our cloud-based platform",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, index) => (
        <div key={index}>
          <FeatureCard
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        </div>
      ))}
    </div>
  );
}

function PricingGrid({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <div>
        <PricingCard
          name="Student"
          price="$19"
          period="month"
          description="For individual medical students"
          features={[
            "Unlimited case access (20+ cases)",
            "Shadow & Clinical Interview modes",
            "AI-powered feedback & scoring",
            "Leaderboard & achievements",
            "Progress tracking dashboard",
            "Community support",
          ]}
          cta="Start Free Trial"
          onSelect={onLoginClick}
        />
      </div>

      <div>
        <PricingCard
          name="Student Pro"
          price="$39"
          period="month"
          description="Advanced features for serious learners"
          features={[
            "Everything in Student plan",
            "50+ premium cases",
            "Specialty-focused tracks",
            "Advanced analytics & insights",
            "SOAP note AI grading",
            "Priority support",
            "Downloadable certificates",
          ]}
          popular={true}
          cta="Start Free Trial"
          onSelect={onLoginClick}
        />
      </div>

      <div>
        <PricingCard
          name="Institution"
          price="Custom"
          period="year"
          description="For medical schools & hospitals"
          features={[
            "Everything in Pro plan",
            "Unlimited student accounts",
            "Faculty dashboard & analytics",
            "Cohort management tools",
            "Custom case authoring",
            "OSCE-style assessments",
            "White-label options",
            "Dedicated account manager",
            "SSO integration",
            "Custom curriculum alignment",
          ]}
          cta="Contact Sales"
          onSelect={onLoginClick}
        />
      </div>
    </div>
  );
}

function HowItWorksSection1() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
      <div>
        <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          Mode 1
        </div>
        <h3 className="text-3xl font-bold mb-4">Shadow Mode</h3>
        <p className="text-lg text-muted-foreground mb-6">
          Watch AI doctors conduct patient interviews. Pause anytime to ask
          questions like "Why this test?" or "Why not X?" Learn from expert
          clinical reasoning in action.
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span>Interactive AI doctor-patient conversations</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span>Highlighted teachable moments</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span>Pause and ask questions anytime</span>
          </li>
        </ul>
      </div>
      <div className="rounded-xl overflow-hidden shadow-lg">
        <img src={studentPracticeImage} alt="Shadow Mode" className="w-full" />
      </div>
    </div>
  );
}

function HowItWorksSection2() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div className="order-2 lg:order-1 rounded-xl overflow-hidden shadow-lg">
        <img
          src={facultyAnalyticsImage}
          alt="Clinical Interview Mode"
          className="w-full"
        />
      </div>
      <div className="order-1 lg:order-2">
        <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          Mode 2
        </div>
        <h3 className="text-3xl font-bold mb-4">Clinical Interview Mode</h3>
        <p className="text-lg text-muted-foreground mb-6">
          Take the lead as the doctor. Conduct interviews, perform exams, order
          tests, make diagnoses, and document everything with SOAP notes.
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span>Full patient encounter simulation</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span>Virtual physical exams and investigations</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span>Automated SOAP note grading</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const heroSlides = [
    {
      title: "Revolutionize Medical Education with AI",
      subtitle:
        "Practice clinical interviews, shadow AI doctors, and receive OSCE-style assessments in a safe, scalable environment.",
      image: heroImage,
      ctaPrimary: "Get Started",
      ctaSecondary: "Watch Demo",
    },
    {
      title: "AI Patient Simulations",
      subtitle:
        "Practice with realistic AI patients that respond naturally to your clinical approach. Experience safe, repeatable learning environments.",
      image: studentPracticeImage,
      ctaPrimary: "Try It Now",
      ctaSecondary: "Learn More",
    },
    {
      title: "Shadow Mode Learning",
      subtitle:
        "Observe expert AI doctors and learn from their clinical reasoning. Pause anytime to ask questions and understand every decision.",
      image: facultyAnalyticsImage,
      ctaPrimary: "Start Learning",
      ctaSecondary: "View Demo",
    },
    {
      title: "OSCE-Style Assessment & Feedback",
      subtitle:
        "Receive detailed, rubric-based feedback on every case. Track your performance and improve with data-driven insights.",
      image: heroImage,
      ctaPrimary: "Get Started",
      ctaSecondary: "See Features",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav onLoginClick={handleOpenLoginModal} />

      <main className="flex-1">
        <HeroCarousel slides={heroSlides} onLoginClick={handleOpenLoginModal} />

        <section id="features" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                Transforming Clinical Education
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Safe, scalable AI-powered training that prepares students for
                real patient encounters
              </p>
            </div>

            <FeaturesGrid />
          </div>
        </section>

        <section id="how-it-works" className="py-20 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground">
                Three powerful modes for comprehensive clinical training
              </p>
            </div>

            <HowItWorksSection1 />
            <HowItWorksSection2 />
          </div>
        </section>

        <section id="pricing" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Flexible pricing for students and institutions. All plans
                include 14-day free trial.
              </p>
            </div>

            <PricingGrid onLoginClick={handleOpenLoginModal} />

            <div className="text-center mt-12">
              <p className="text-sm text-muted-foreground mb-4">
                All plans include 14-day free trial. No credit card required.
              </p>
              <div className="flex flex-wrap gap-6 justify-center text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Cancel anytime
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Education discounts available
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Group pricing for cohorts
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Clinical Lab. All rights reserved.</p>
        </div>
      </footer>

      <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseLoginModal} />
    </div>
  );
}
