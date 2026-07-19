import { DashboardConfig } from "../types/dashboard";

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
