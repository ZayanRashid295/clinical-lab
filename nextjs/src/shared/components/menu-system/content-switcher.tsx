"use client";

import React from "react";
import DashboardContent from "@/shared/components/dashboard/dashboard-content";
import RidesContent from "@/shared/components/rides/rides-content";
import MedAppContent from "@/shared/components/med-app/med-app-content";
import ShadowModeContent from "@/shared/components/shadow-mode/shadow-mode-content";
import ShadowMode2Content from "@/shared/components/shadow-mode/shadow-mode-2-content";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

interface ContentSwitcherProps {
  activeMenu: string;
}

export default function ContentSwitcher({ activeMenu }: ContentSwitcherProps) {
  switch (activeMenu) {
    case "dashboard":
      return <DashboardContent isFullScreen={false} />;
    case "rides":
      return <RidesContent isFullScreen={false} />;
    case "med-app":
      return <MedAppContent isFullScreen={false} />;
    case "shadow-mode":
      return <ShadowModeContent isFullScreen={false} />;
    case "shadow-mode2":
      return <ShadowMode2Content isFullScreen={false} />;
    case "fleet":
      return (
        <UnderConstruction
          menuTitle="Fleet Management"
          menuIcon="🚛"
          description="Comprehensive fleet management system for tracking vehicles, drivers, and maintenance schedules."
          estimatedCompletion="3 weeks"
          features={[
            "Vehicle tracking and monitoring",
            "Driver management and scheduling",
            "Maintenance scheduling and alerts",
            "Fuel consumption analytics",
            "Route optimization",
            "Real-time GPS tracking",
          ]}
          isFullScreen={false}
        />
      );
    case "analytics":
      return (
        <UnderConstruction
          menuTitle="Analytics Dashboard"
          menuIcon="📊"
          description="Advanced analytics and reporting system with real-time insights and data visualization."
          estimatedCompletion="2 weeks"
          features={[
            "Real-time performance metrics",
            "Interactive data visualizations",
            "Custom report generation",
            "Trend analysis and forecasting",
            "Export capabilities",
            "Automated alerts and notifications",
          ]}
          isFullScreen={false}
        />
      );
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
      return (
        <UnderConstruction
          menuTitle="Zoom Simulation"
          menuIcon="📹"
          description="Interactive video conferencing simulation for medical training and virtual consultations."
          estimatedCompletion="5 weeks"
          features={[
            "Virtual patient consultations",
            "Multi-participant video calls",
            "Screen sharing and collaboration",
            "Recording and playback",
            "AI-powered patient interactions",
            "Assessment and feedback tools",
          ]}
          isFullScreen={false}
        />
      );
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
    case "ride-history":
      return (
        <UnderConstruction
          menuTitle="Ride History"
          menuIcon="📋"
          description="Complete history of all rides with detailed analytics and filtering options."
          estimatedCompletion="2 weeks"
          features={[
            "Comprehensive ride records",
            "Advanced filtering and search",
            "Performance analytics",
            "Export capabilities",
            "Rating and feedback system",
          ]}
          isFullScreen={false}
        />
      );
    case "active-rides":
      return (
        <UnderConstruction
          menuTitle="Active Rides"
          menuIcon="🚗"
          description="Real-time monitoring of all active rides with live tracking and status updates."
          estimatedCompletion="2 weeks"
          features={[
            "Live ride tracking",
            "Real-time status updates",
            "Emergency response system",
            "Driver communication",
            "Route optimization",
          ]}
          isFullScreen={false}
        />
      );
    case "ride-requests":
      return (
        <UnderConstruction
          menuTitle="Ride Requests"
          menuIcon="📱"
          description="Manage incoming ride requests with intelligent matching and assignment algorithms."
          estimatedCompletion="3 weeks"
          features={[
            "Request management system",
            "Intelligent driver matching",
            "Priority handling",
            "Automated notifications",
            "Request analytics",
          ]}
          isFullScreen={false}
        />
      );
    case "rides-management":
      return (
        <UnderConstruction
          menuTitle="Rides Management"
          menuIcon="🎯"
          description="Advanced rides management system with comprehensive control and monitoring capabilities."
          estimatedCompletion="4 weeks"
          features={[
            "Complete ride lifecycle management",
            "Performance monitoring",
            "Quality assurance tools",
            "Customer service integration",
            "Analytics and reporting",
          ]}
          isFullScreen={false}
        />
      );
    case "vehicles":
      return (
        <UnderConstruction
          menuTitle="Vehicle Management"
          menuIcon="🚗"
          description="Comprehensive vehicle fleet management with tracking, maintenance, and analytics."
          estimatedCompletion="3 weeks"
          features={[
            "Vehicle registration and tracking",
            "Maintenance scheduling",
            "Performance monitoring",
            "Fuel efficiency tracking",
            "Insurance and documentation",
          ]}
          isFullScreen={false}
        />
      );
    case "drivers":
      return (
        <UnderConstruction
          menuTitle="Driver Management"
          menuIcon="👨‍💼"
          description="Complete driver management system with scheduling, performance tracking, and communication tools."
          estimatedCompletion="3 weeks"
          features={[
            "Driver profiles and documentation",
            "Schedule management",
            "Performance tracking",
            "Communication tools",
            "Training and certification",
          ]}
          isFullScreen={false}
        />
      );
    case "maintenance":
      return (
        <UnderConstruction
          menuTitle="Maintenance System"
          menuIcon="🔧"
          description="Automated maintenance scheduling and tracking system for fleet vehicles."
          estimatedCompletion="2 weeks"
          features={[
            "Automated maintenance scheduling",
            "Service history tracking",
            "Parts inventory management",
            "Cost tracking and analytics",
            "Maintenance alerts",
          ]}
          isFullScreen={false}
        />
      );
    case "revenue":
      return (
        <UnderConstruction
          menuTitle="Revenue Analytics"
          menuIcon="💰"
          description="Comprehensive revenue tracking and analytics with detailed financial insights."
          estimatedCompletion="2 weeks"
          features={[
            "Revenue tracking and reporting",
            "Financial analytics",
            "Profit margin analysis",
            "Trend identification",
            "Forecasting and projections",
          ]}
          isFullScreen={false}
        />
      );
    case "performance":
      return (
        <UnderConstruction
          menuTitle="Performance Metrics"
          menuIcon="📊"
          description="Advanced performance monitoring and analytics for system optimization."
          estimatedCompletion="2 weeks"
          features={[
            "Real-time performance monitoring",
            "Key performance indicators",
            "System optimization insights",
            "Performance alerts",
            "Historical analysis",
          ]}
          isFullScreen={false}
        />
      );
    case "reports":
      return (
        <UnderConstruction
          menuTitle="Reports & Analytics"
          menuIcon="📝"
          description="Comprehensive reporting system with customizable reports and data visualization."
          estimatedCompletion="3 weeks"
          features={[
            "Custom report generation",
            "Data visualization tools",
            "Scheduled reporting",
            "Export capabilities",
            "Interactive dashboards",
          ]}
          isFullScreen={false}
        />
      );
    case "transactions":
      return (
        <UnderConstruction
          menuTitle="Transaction Management"
          menuIcon="🧾"
          description="Complete transaction tracking and management system with detailed financial records."
          estimatedCompletion="2 weeks"
          features={[
            "Transaction history",
            "Payment processing",
            "Refund management",
            "Financial reconciliation",
            "Audit trails",
          ]}
          isFullScreen={false}
        />
      );
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
    default:
      return <DashboardContent isFullScreen={false} />;
  }
}
