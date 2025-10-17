import { DashboardConfig } from "../types/dashboard";

export const mainDashboardConfig: DashboardConfig = {
  title: "Ride Sharing Dashboard",
  description: "Monitor and manage your ride sharing platform",
  stats: [
    {
      label: "Active Rides",
      value: "47",
      icon: "🚗",
      color: "blue",
    },
    {
      label: "Total Drivers",
      value: "1,234",
      icon: "👨‍💼",
      color: "green",
    },
    {
      label: "Today's Revenue",
      value: "$12,847",
      icon: "💰",
      color: "purple",
    },
    {
      label: "Customer Rating",
      value: "4.8",
      icon: "⭐",
      color: "yellow",
    },
  ],
  quickActions: [
    {
      title: "Manage Rides",
      description: "View and manage active rides",
      icon: "🚗",
      color: "blue",
    },
    {
      title: "Driver Management",
      description: "Manage driver accounts and status",
      icon: "👨‍💼",
      color: "green",
    },
    {
      title: "Payment Processing",
      description: "Handle payments and payouts",
      icon: "💳",
      color: "purple",
    },
    {
      title: "Analytics",
      description: "View performance analytics",
      icon: "📊",
      color: "yellow",
    },
    {
      title: "Fleet Management",
      description: "Manage vehicles and routes",
      icon: "🚙",
      color: "red",
    },
    {
      title: "Support",
      description: "Customer support and help",
      icon: "🎧",
      color: "indigo",
    },
  ],
  recentActivity: [
    {
      type: "success",
      message: "Ride #1234 completed successfully",
      timestamp: "5 minutes ago",
    },
    {
      type: "info",
      message: "New driver John Doe registered",
      timestamp: "15 minutes ago",
    },
    {
      type: "success",
      message: "Payment of $45.50 processed",
      timestamp: "23 minutes ago",
    },
    {
      type: "info",
      message: "Ride #1233 started - Downtown to Airport",
      timestamp: "31 minutes ago",
    },
    {
      type: "warning",
      message: "Driver Mike reported a vehicle issue",
      timestamp: "1 hour ago",
    },
  ],
};

export const adminDashboardConfig: DashboardConfig = {
  title: "Administration Dashboard",
  description: "Manage system administration and configuration",
  stats: [
    {
      label: "Total Users",
      value: "184",
      icon: "👥",
      color: "blue",
    },
    {
      label: "Active Roles",
      value: "5",
      icon: "🔐",
      color: "green",
    },
    {
      label: "Reports",
      value: "12",
      icon: "📊",
      color: "purple",
    },
    {
      label: "Audit Logs",
      value: "2,847",
      icon: "📝",
      color: "yellow",
    },
  ],
  quickActions: [
    {
      title: "User Management",
      description: "Manage system users and permissions",
      icon: "👥",
      color: "blue",
    },
    {
      title: "Role Management",
      description: "Define and manage user roles",
      icon: "🔐",
      color: "green",
    },
    {
      title: "System Settings",
      description: "Configure system-wide settings",
      icon: "⚙️",
      color: "purple",
    },
    {
      title: "Reports",
      description: "Generate and manage reports",
      icon: "📊",
      color: "yellow",
    },
    {
      title: "Audit Logs",
      description: "Monitor system activities",
      icon: "📝",
      color: "red",
    },
  ],
  recentActivity: [
    {
      type: "success",
      message: "John Smith created a new user account",
      timestamp: "2 hours ago",
    },
    {
      type: "info",
      message: "System backup completed successfully",
      timestamp: "4 hours ago",
    },
    {
      type: "warning",
      message: "Failed login attempt detected",
      timestamp: "6 hours ago",
    },
    {
      type: "info",
      message: "Monthly revenue report generated",
      timestamp: "1 day ago",
    },
  ],
};

export const analyticsDashboardConfig: DashboardConfig = {
  title: "Analytics & Reports",
  description: "Comprehensive analytics and reporting dashboard",
  quickActions: [
    {
      title: "Ride Analytics",
      description: "Analyze ride patterns and performance",
      icon: "🚗",
      color: "blue",
    },
    {
      title: "Location Analytics",
      description: "Track location usage and trends",
      icon: "📍",
      color: "green",
    },
    {
      title: "Audit Logs",
      description: "Monitor system activities and changes",
      icon: "📝",
      color: "purple",
    },
    {
      title: "Payment Analytics",
      description: "Analyze payment trends and patterns",
      icon: "💳",
      color: "yellow",
    },
  ],
};

export const paymentAnalyticsConfig: DashboardConfig = {
  title: "Payment Analytics",
  description: "Comprehensive payment analytics and insights",
  quickActions: [
    {
      title: "Revenue Trends",
      description: "Coming soon...",
      icon: "📈",
      color: "green",
    },
    {
      title: "Payment Methods",
      description: "Coming soon...",
      icon: "💳",
      color: "blue",
    },
    {
      title: "Transaction Analysis",
      description: "Coming soon...",
      icon: "📊",
      color: "purple",
    },
  ],
};

// Generic dashboard configurations that can be used as templates
export const genericAdminDashboardConfig: DashboardConfig = {
  title: "Administration Dashboard",
  description: "Manage system administration and configuration",
  stats: [
    {
      label: "Total Users",
      value: "0",
      icon: "👥",
      color: "blue",
    },
    {
      label: "Active Roles",
      value: "0",
      icon: "🔐",
      color: "green",
    },
    {
      label: "Reports",
      value: "0",
      icon: "📊",
      color: "purple",
    },
    {
      label: "Audit Logs",
      value: "0",
      icon: "📝",
      color: "yellow",
    },
  ],
  quickActions: [
    {
      title: "User Management",
      description: "Manage system users and permissions",
      icon: "👥",
      color: "blue",
    },
    {
      title: "Role Management",
      description: "Define and manage user roles",
      icon: "🔐",
      color: "green",
    },
    {
      title: "System Settings",
      description: "Configure system-wide settings",
      icon: "⚙️",
      color: "purple",
    },
    {
      title: "Reports",
      description: "Generate and manage reports",
      icon: "📊",
      color: "yellow",
    },
    {
      title: "Audit Logs",
      description: "Monitor system activities",
      icon: "📝",
      color: "red",
    },
  ],
  recentActivity: [
    {
      type: "info",
      message: "System initialized",
      timestamp: "Just now",
    },
  ],
};

export const genericAnalyticsDashboardConfig: DashboardConfig = {
  title: "Analytics & Reports",
  description: "Comprehensive analytics and reporting dashboard",
  quickActions: [
    {
      title: "Data Analytics",
      description: "Analyze data patterns and performance",
      icon: "📊",
      color: "blue",
    },
    {
      title: "Location Analytics",
      description: "Track location usage and trends",
      icon: "📍",
      color: "green",
    },
    {
      title: "Audit Logs",
      description: "Monitor system activities and changes",
      icon: "📝",
      color: "purple",
    },
    {
      title: "Payment Analytics",
      description: "Analyze payment trends and patterns",
      icon: "💳",
      color: "yellow",
    },
  ],
};

export const genericPaymentAnalyticsConfig: DashboardConfig = {
  title: "Payment Analytics",
  description: "Comprehensive payment analytics and insights",
  quickActions: [
    {
      title: "Revenue Trends",
      description: "Coming soon...",
      icon: "📈",
      color: "green",
    },
    {
      title: "Payment Methods",
      description: "Coming soon...",
      icon: "💳",
      color: "blue",
    },
    {
      title: "Transaction Analysis",
      description: "Coming soon...",
      icon: "📊",
      color: "purple",
    },
  ],
};
