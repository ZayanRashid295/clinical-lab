import React from "react";

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: string[];
  order: number;
  submenu?: MenuItem[] | null;
  badge?: string | number;
  disabled?: boolean;
}

export interface MenuConfig {
  items: MenuItem[];
  defaultActiveItem?: string;
  collapsible?: boolean;
  showIcons?: boolean;
}

export interface MenuPermissions {
  [role: string]: {
    canAccessAll: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canViewAnalytics: boolean;
    canManageFleet: boolean;
    canViewReports: boolean;
    canManageRides: boolean;
    canManagePayments: boolean;
    canManageSettings: boolean;
    canViewDashboard: boolean;
  };
}

export interface MenuSystemProps {
  customDashboard?: any;
  customMenuItems?: MenuItem[];
  onMenuChange?: (menuId: string) => void;
  applicationTitle?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  customContent?: Record<string, any>;
  children?: React.ReactNode;
}

export interface MenuState {
  activeMenu: string;
  expandedMenus: string[];
  isCollapsed: boolean;
  menuItems: MenuItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  avatar?: string;
}

export interface UIConfig {
  menuLayout: "horizontal" | "vertical";
  menuStyle: "sidebar" | "topbar";
  theme: "light" | "dark" | "auto";
  primaryColor: string;
  secondaryColor?: string;
}
