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
