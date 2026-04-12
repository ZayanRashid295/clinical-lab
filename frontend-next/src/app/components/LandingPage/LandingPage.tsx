"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { LandingNav } from "./LandingNav";
import { HeroCarousel } from "./HeroCarousel";
import { FeatureCard } from "./FeatureCard";
import { PricingCard } from "./PricingCard";
import { VideoModal } from "./VideoModal";
import { SettingsButton } from "@/shared/components/Settings/SettingsButton";
import MenuLayoutSettings from "@/shared/components/Settings/MenuLayoutSettings";
import { Button } from "@/shared/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/shared/utils/cn";
import { SubscriptionPackagesService } from "@/app/services/subscriptions/subscription-packages.service";
import { SubscriptionPackage } from "@/app/types/subscription";
import { authService } from "@/shared";
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

const studentPracticeImage =
  "/images/Student_practicing_virtual_patient_interview_225e435d.png";
const facultyAnalyticsImage =
  "/images/Faculty_reviewing_student_analytics_dashboard_94a01cbe.png";
const heroImage =
  "/images/Medical_students_AI_learning_collaboration_6db2826f.png";

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

  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-0 transition-all duration-700 ease-out",
        isVisible && "opacity-100 translate-y-0",
        !isVisible && "translate-y-12"
      )}
    >
      {features.map((feature, index) => (
        <div
          key={index}
          className={cn(
            "opacity-0 transition-all duration-700 ease-out",
            isVisible && "opacity-100 translate-y-0",
            !isVisible && "translate-y-12"
          )}
          style={{ transitionDelay: isVisible ? `${index * 100}ms` : "0ms" }}
        >
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

function PricingGrid({
  onLoginClick,
  onPackageSelect,
  isAuthenticated,
}: {
  onLoginClick: () => void;
  onPackageSelect: (packageId: string) => void;
  isAuthenticated: boolean;
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const packagesService = new SubscriptionPackagesService();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        if (process.env.NODE_ENV === "development") {
          console.log("Fetching subscription packages...");
        }
        const response = await packagesService.getPackages({ status: "ACTIVE" });
        
        // Handle both array and paginated response formats
        const packagesList = Array.isArray(response) 
          ? response 
          : (response?.data || []);
        
        // Sort by price ascending
        const sortedPackages = packagesList.sort((a, b) => {
          const priceA = parseFloat(a.price?.toString() || "0");
          const priceB = parseFloat(b.price?.toString() || "0");
          return priceA - priceB;
        });
        
        setPackages(sortedPackages);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching packages:", error);
        }
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-600">Loading pricing plans...</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-4">
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          No pricing plans available at the moment.
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm">
          Please check back later or contact support for more information.
        </p>
      </div>
    );
  }

  // Map packages to pricing cards
  // First package: Student (basic)
  // Second package: Student Pro (if exists)
  // Third: Institution or custom (if exists)
  const studentPackage = packages[0] || null;
  const studentProPackage = packages[1] || null;
  const institutionPackage = packages[2] || null;

  // Debug: Log packages to console (development only)
  if (process.env.NODE_ENV === "development") {
    console.log("Rendering packages:", {
      total: packages.length,
      studentPackage: studentPackage?.name,
      studentProPackage: studentProPackage?.name,
      institutionPackage: institutionPackage?.name,
      isVisible,
    });
  }

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto px-4 items-stretch"
    >
      {studentPackage && (
        <div className="transition-all duration-700 ease-out">
          <PricingCard
            name={studentPackage.name || "Student"}
            price={`$${parseFloat(studentPackage.price?.toString() || "0").toFixed(2)}`}
            period="month"
            description={studentPackage.description || "For individual medical students"}
            features={
              studentPackage.subscriptionFeatures?.map(
                (f) => f.packageFeature?.name || ""
              ).filter(Boolean) || [
                "Unlimited case access (20+ cases)",
                "Shadow & Clinical Interview modes",
                "AI-powered feedback & scoring",
              ]
            }
            cta="Start Free Trial"
            packageId={studentPackage.id}
            onSelect={() => onPackageSelect(studentPackage.id)}
          />
        </div>
      )}

      {studentProPackage && (
        <div className="transition-all duration-700 ease-out delay-100">
          <PricingCard
            name={studentProPackage.name || "Student Pro"}
            price={`$${parseFloat(studentProPackage.price?.toString() || "0").toFixed(2)}`}
            period="month"
            description={studentProPackage.description || "Advanced features for serious learners"}
            features={
              studentProPackage.subscriptionFeatures?.map(
                (f) => f.packageFeature?.name || ""
              ).filter(Boolean) || [
                "Everything in Student plan",
                "50+ premium cases",
                "Specialty-focused tracks",
              ]
            }
            popular={true}
            cta="Start Free Trial"
            packageId={studentProPackage.id}
            onSelect={() => onPackageSelect(studentProPackage.id)}
          />
        </div>
      )}

      {institutionPackage ? (
        <div className="transition-all duration-700 ease-out delay-200">
          <PricingCard
            name={institutionPackage.name || "Institution"}
            price={
              parseFloat(institutionPackage.price?.toString() || "0") === 0
                ? "Custom"
                : `$${parseFloat(institutionPackage.price?.toString() || "0").toFixed(2)}`
            }
            period="year"
            description={institutionPackage.description || "For medical schools & hospitals"}
            features={
              institutionPackage.subscriptionFeatures?.map(
                (f) => f.packageFeature?.name || ""
              ).filter(Boolean) || [
                "Everything in Pro plan",
                "Unlimited student accounts",
                "Faculty dashboard & analytics",
              ]
            }
            cta="Contact Sales"
            packageId={institutionPackage.id}
            onSelect={() => onPackageSelect(institutionPackage.id)}
          />
        </div>
      ) : (
        <div className="transition-all duration-700 ease-out delay-200">
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
      )}
    </div>
  );
}

function HowItWorksSection1() {
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({
    threshold: 0.2,
  });
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation({
    threshold: 0.2,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
      <div
        ref={contentRef}
        className={cn(
          "opacity-0 transition-all duration-700 ease-out",
          contentVisible && "opacity-100 translate-x-0",
          !contentVisible && "-translate-x-12"
        )}
      >
        <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          Mode 1
        </div>
        <h3 className="text-3xl font-bold mb-4 text-foreground">Shadow Mode</h3>
        <p className="text-lg text-muted-foreground mb-6">
          Watch AI doctors conduct patient interviews. Pause anytime to ask
          questions like &quot;Why this test?&quot; or &quot;Why not X?&quot;
          Learn from expert clinical reasoning in action.
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-chart-3 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-foreground">
              Interactive AI doctor-patient conversations
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-chart-3 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-foreground">
              Highlighted teachable moments
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-chart-3 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-foreground">
              Pause and ask questions anytime
            </span>
          </li>
        </ul>
      </div>
      <div
        ref={imageRef}
        className={cn(
          "rounded-xl overflow-hidden shadow-lg opacity-0 transition-all duration-700 ease-out delay-200",
          imageVisible && "opacity-100 translate-x-0",
          !imageVisible && "translate-x-12"
        )}
      >
        <Image
          src={studentPracticeImage}
          alt="Shadow Mode"
          width={800}
          height={600}
          className="w-full h-auto"
          unoptimized
        />
      </div>
    </div>
  );
}

function HowItWorksSection2() {
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({
    threshold: 0.2,
  });
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation({
    threshold: 0.2,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div
        ref={imageRef}
        className={cn(
          "order-2 lg:order-1 rounded-xl overflow-hidden shadow-lg opacity-0 transition-all duration-700 ease-out delay-200",
          imageVisible && "opacity-100 translate-x-0",
          !imageVisible && "-translate-x-12"
        )}
      >
        <Image
          src={facultyAnalyticsImage}
          alt="Clinical Interview Mode"
          width={800}
          height={600}
          className="w-full h-auto"
          unoptimized
        />
      </div>
      <div
        ref={contentRef}
        className={cn(
          "order-1 lg:order-2 opacity-0 transition-all duration-700 ease-out",
          contentVisible && "opacity-100 translate-x-0",
          !contentVisible && "translate-x-12"
        )}
      >
        <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          Mode 2
        </div>
        <h3 className="text-3xl font-bold mb-4 text-foreground">
          Clinical Interview Mode
        </h3>
        <p className="text-lg text-muted-foreground mb-6">
          Take the lead as the doctor. Conduct interviews, perform exams, order
          tests, make diagnoses, and document everything with SOAP notes.
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-chart-3 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-foreground">
              Full patient encounter simulation
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-chart-3 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-foreground">
              Virtual physical exams and investigations
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-chart-3 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-foreground">Automated SOAP note grading</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function LandingPage() {
  const router = useRouter();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };
    checkAuth();
    
    // Check every 2 seconds to reduce load (less frequent than LandingNav)
    const interval = setInterval(checkAuth, 2000);
    
    // Also listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'userData') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const goToAuth = (opts?: { mode?: "login" | "signup"; packageId?: string }) => {
    const q: Record<string, string> = {};
    if (opts?.mode === "signup") q.mode = "signup";
    if (opts?.packageId) q.packageId = opts.packageId;
    const search = new URLSearchParams(q).toString();
    void router.push(search ? `/auth?${search}` : "/auth");
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      goToAuth();
    }
  };

  const handlePackageSelect = (packageId: string) => {
    if (isAuthenticated) {
      router.push(`/checkout-basic?packageId=${packageId}`);
    } else {
      goToAuth({ packageId });
    }
  };

  const handleOpenVideoModal = () => {
    setIsVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <LandingNav
        onLoginClick={() => goToAuth()}
        onSignupClick={() => goToAuth({ mode: "signup" })}
      />

      <main className="flex-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <HeroCarousel
          slides={heroSlides}
          onLoginClick={handleGetStarted}
          onDemoClick={handleOpenVideoModal}
          isAuthenticated={isAuthenticated}
        />

        <section id="features" className="py-20 px-6 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Transforming Clinical Education
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Safe, scalable AI-powered training that prepares students for
                real patient encounters
              </p>
            </div>

            <FeaturesGrid />
          </div>
        </section>

        <section
          id="how-it-works"
          className="py-20 px-6 bg-gray-50 dark:bg-gray-800"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Three powerful modes for comprehensive clinical training
              </p>
            </div>

            <HowItWorksSection1 />
            <HowItWorksSection2 />
          </div>
        </section>

        <section id="pricing" className="py-20 px-6 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                Choose Your Plan
              </h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Flexible pricing for students and institutions. All plans include 14-day free trial.
              </p>
            </div>

            <PricingGrid
              onLoginClick={() => goToAuth()}
              onPackageSelect={handlePackageSelect}
              isAuthenticated={isAuthenticated}
            />

            <div className="text-center mt-12">
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                All plans include 14-day free trial. No credit card required.
              </p>
              <div className="flex flex-wrap gap-4 md:gap-6 justify-center text-sm md:text-base">
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  <Check className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                  <span>Cancel anytime</span>
                </span>
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  <Check className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                  <span>Education discounts available</span>
                </span>
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  <Check className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                  <span>Group pricing for cohorts</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600 dark:text-gray-300">
          <p>&copy; 2025 Clinical Lab. All rights reserved.</p>
        </div>
      </footer>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        videoSrc="/video/promotional.mp4"
        title="Clinical Lab Demo"
      />
      <MenuLayoutSettings
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />
      <SettingsButton onClick={handleOpenSettings} />
    </div>
  );
}
