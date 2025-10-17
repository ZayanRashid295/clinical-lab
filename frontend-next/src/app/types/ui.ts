// UI and component-related type definitions

import { User } from "./core";

export type AlertSeverity = "low" | "medium" | "high";

export interface Alert {
  id: string;
  passenger: string;
  type: string;
  message: string;
  time: string;
  severity: AlertSeverity;
}

export interface StatCard {
  id: string;
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor?: string;
  textColor?: string;
}

// Data table types
export interface Column<T = any> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row?: T) => React.ReactNode;
}

export interface Action<T = any> {
  label: string;
  onClick: (row: T) => void;
  className?: string;
  disabled?: (row: T) => boolean;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  title?: string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

// Menu types
export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: string[];
  order: number;
  submenu?: MenuItem[] | null;
}

// Component prop types
export interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  customActions?: React.ReactNode;
  onMobileMenuToggle?: () => void;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

export interface DashboardContentProps {
  title?: string;
  showQuickAction?: boolean;
  quickActionLabel?: string;
  onQuickAction?: () => void;
  customStats?: React.ReactNode;
  customAlerts?: React.ReactNode;
  customTable?: React.ReactNode;
}

export interface MenuSystemProps {
  children?: React.ReactNode;
  customDashboard?: React.ComponentType<any>;
  customMenuItems?: MenuItem[];
  onMenuChange?: (menuId: string) => void;
  applicationTitle?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  customContent?: { [key: string]: React.ComponentType<any> };
  contentRegistry?: import("./dashboard").ContentRegistry;
}
