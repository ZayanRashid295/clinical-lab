"use client";

import React from "react";
import DashboardContent from "@/shared/components/dashboard/dashboard-content";
import MedAppContent from "@/shared/components/med-app/med-app-content";
import QuestionBankPage from "@/app/components/study/QuestionBankPage";
import StudyMaterialsPage from "@/app/components/study/StudyMaterialsPage";
import FlashcardsPage from "@/app/components/study/FlashcardsPage";
import NotesPage from "@/app/components/study/NotesPage";
import TestCreationPage from "@/app/components/test-creation/TestCreationPage";
import TestSessionPage from "@/app/components/test-session/TestSessionPage";

import UnderConstruction from "@/shared/components/placeholders/under-construction";
import ZoomSimulation from "@/app/components/zoom-simulation/zoom-simulation";
import PaymentHistoryContent from "@/components/payments/payment-history-content";

interface ContentSwitcherProps {
  activeMenu: string;
}

export default function ContentSwitcher({ activeMenu }: ContentSwitcherProps) {
  switch (activeMenu) {
    case "dashboard":
      return <DashboardContent isFullScreen={false} />;
    case "med-app":
      return <MedAppContent isFullScreen={false} />;
    case "payments":
      return (
        <UnderConstruction
          menuTitle="Payment System"
          menuIcon="💳"
          description="Secure payment processing system with multiple payment methods and transaction management."
          estimatedCompletion="4 weeks"
          features={[
            "Multiple payment gateways",
            "Transaction history and reporting",
            "Automated billing and invoicing",
            "Payment method management",
            "Fraud detection and security",
            "Mobile payment support",
          ]}
          isFullScreen={false}
        />
      );
    case "zoom-simulation":
      return <ZoomSimulation />;
    case "admin":
      return (
        <UnderConstruction
          menuTitle="Admin Panel"
          menuIcon="⚙️"
          description="Comprehensive administrative control panel for system management and user administration."
          estimatedCompletion="3 weeks"
          features={[
            "User management and roles",
            "System configuration",
            "Security and access control",
            "Audit logs and monitoring",
            "Backup and recovery",
            "Performance monitoring",
          ]}
          isFullScreen={false}
        />
      );
    // Submenu items
    case "transactions":
      return <PaymentHistoryContent />;
    case "payouts":
      return (
        <UnderConstruction
          menuTitle="Driver Payouts"
          menuIcon="💰"
          description="Automated driver payout system with flexible scheduling and payment methods."
          estimatedCompletion="3 weeks"
          features={[
            "Automated payout calculations",
            "Flexible payment schedules",
            "Multiple payment methods",
            "Payout history and tracking",
            "Tax reporting",
          ]}
          isFullScreen={false}
        />
      );
    case "billing":
      return (
        <UnderConstruction
          menuTitle="Billing System"
          menuIcon="🧾"
          description="Comprehensive billing and invoicing system for customers and partners."
          estimatedCompletion="3 weeks"
          features={[
            "Automated billing",
            "Invoice generation",
            "Payment tracking",
            "Billing analytics",
            "Customer billing portal",
          ]}
          isFullScreen={false}
        />
      );
    case "users":
      return (
        <UnderConstruction
          menuTitle="User Management"
          menuIcon="👥"
          description="Complete user administration system with role management and access control."
          estimatedCompletion="2 weeks"
          features={[
            "User registration and profiles",
            "Role-based access control",
            "User activity monitoring",
            "Account management",
            "Security settings",
          ]}
          isFullScreen={false}
        />
      );
    case "roles":
      return (
        <UnderConstruction
          menuTitle="Role Management"
          menuIcon="🔐"
          description="Advanced role and permission management system for secure access control."
          estimatedCompletion="2 weeks"
          features={[
            "Role creation and management",
            "Permission assignment",
            "Access control policies",
            "Role hierarchy",
            "Audit and compliance",
          ]}
          isFullScreen={false}
        />
      );
    case "settings":
      return (
        <UnderConstruction
          menuTitle="System Settings"
          menuIcon="⚙️"
          description="Comprehensive system configuration and settings management interface."
          estimatedCompletion="2 weeks"
          features={[
            "System configuration",
            "Application settings",
            "Integration management",
            "Security settings",
            "Backup and recovery",
          ]}
          isFullScreen={false}
        />
      );
    // Test Creation menu items
    case "test-creation":
      return <TestCreationPage />;
    case "create-new-test":
      return <TestCreationPage />;
    case "test-templates":
      return (
        <UnderConstruction
          menuTitle="Test Templates"
          menuIcon="📋"
          description="Pre-built test templates for quick test creation with customizable questions and formats."
          estimatedCompletion="2 weeks"
          features={[
            "Template library",
            "Customizable templates",
            "Quick test creation",
            "Template sharing",
            "Category-based templates",
          ]}
          isFullScreen={false}
        />
      );
    case "question-builder":
      return (
        <UnderConstruction
          menuTitle="Question Builder"
          menuIcon="🔨"
          description="Advanced question creation tool with multiple question types and multimedia support."
          estimatedCompletion="3 weeks"
          features={[
            "Multiple question types",
            "Multimedia support",
            "Question validation",
            "Batch question creation",
            "Question preview",
          ]}
          isFullScreen={false}
        />
      );
    case "test-settings":
      return (
        <UnderConstruction
          menuTitle="Test Settings"
          menuIcon="⚙️"
          description="Comprehensive test configuration and settings management for optimal test experience."
          estimatedCompletion="2 weeks"
          features={[
            "Test configuration",
            "Time limits and rules",
            "Scoring settings",
            "Access controls",
            "Notification settings",
          ]}
          isFullScreen={false}
        />
      );
    // Test Session menu items
    case "test-session":
      return (
        <UnderConstruction
          menuTitle="Test Sessions"
          menuIcon="🎯"
          description="Comprehensive test session management with real-time monitoring and analytics."
          estimatedCompletion="2 weeks"
          features={[
            "Active test monitoring",
            "Session analytics",
            "Real-time tracking",
            "Performance metrics",
            "Session management",
          ]}
          isFullScreen={false}
        />
      );
    case "active-tests":
      return (
        <UnderConstruction
          menuTitle="Active Tests"
          menuIcon="⏱️"
          description="Monitor and manage all currently active test sessions in real-time."
          estimatedCompletion="2 weeks"
          features={[
            "Real-time monitoring",
            "Session status tracking",
            "Live analytics",
            "Intervention tools",
            "Performance metrics",
          ]}
          isFullScreen={false}
        />
      );
    case "test-history":
      return (
        <UnderConstruction
          menuTitle="Test History"
          menuIcon="📊"
          description="Complete history of all test sessions with detailed analytics and performance tracking."
          estimatedCompletion="2 weeks"
          features={[
            "Historical test data",
            "Performance analytics",
            "Trend analysis",
            "Export capabilities",
            "Detailed reporting",
          ]}
          isFullScreen={false}
        />
      );
    case "practice-mode":
      return (
        <UnderConstruction
          menuTitle="Practice Mode"
          menuIcon="🏃"
          description="Self-paced practice sessions with immediate feedback and learning recommendations."
          estimatedCompletion="2 weeks"
          features={[
            "Self-paced learning",
            "Immediate feedback",
            "Progress tracking",
            "Learning recommendations",
            "Adaptive difficulty",
          ]}
          isFullScreen={false}
        />
      );
    case "timed-tests":
      return (
        <UnderConstruction
          menuTitle="Timed Tests"
          menuIcon="⏰"
          description="Time-constrained test sessions with automatic submission and performance tracking."
          estimatedCompletion="2 weeks"
          features={[
            "Time management",
            "Automatic submission",
            "Performance tracking",
            "Time analytics",
            "Stress simulation",
          ]}
          isFullScreen={false}
        />
      );
    // Study menu items
    case "study":
      return (
        <UnderConstruction
          menuTitle="Study Hub"
          menuIcon="📚"
          description="Comprehensive study management system with question banks, materials, and learning tools."
          estimatedCompletion="2 weeks"
          features={[
            "Question bank management",
            "Study materials organization",
            "Flashcard system",
            "Note-taking tools",
            "Progress tracking",
            "Multi-language support",
          ]}
          isFullScreen={false}
        />
      );
    case "question-bank":
      return (
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Question Bank
              </h1>
              <p className="text-muted-foreground mt-2">
                Browse and practice from our comprehensive medical question
                database
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
                Create Question
              </button>
              <button className="px-4 py-2 border border-input rounded-md">
                My Bookmarks (0)
              </button>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search & Filter</h2>
              <button className="px-3 py-1 border border-input rounded-md text-sm">
                Show Filters
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search questions by content, topic, or keywords..."
                className="w-full px-4 py-2 border border-input rounded-md pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Questions
                  </p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  📚
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Filtered Results
                  </p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  🎯
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  ✓
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bookmarked</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  ⭐
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <button className="p-1">⭐</button>
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-base leading-relaxed">
                      A 65-year-old male presents with chest pain that radiates
                      to the left arm. ECG shows ST elevation in leads II, III,
                      and aVF. What is the most likely diagnosis?
                    </p>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 border border-input rounded-md text-sm">
                        Preview
                      </button>
                      <button className="px-3 py-1 border border-input rounded-md text-sm">
                        Practice
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                      cardiology
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      myocardial_infarction
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                      intermediate
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                      multiple_choice
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>🕐</span>
                      Created 1/15/2024
                    </div>
                    <div className="flex items-center gap-1">
                      <span>👥</span>
                      1,234 attempts
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📈</span>
                      78% success rate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case "study-materials":
      return <StudyMaterialsPage />;
    case "flashcards":
      return <FlashcardsPage />;
    case "notes":
      return <NotesPage />;
    default:
      return <DashboardContent isFullScreen={false} />;
  }
}
