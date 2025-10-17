import { ComponentType } from "react";

export interface ContentConfig {
  [path: string]: ComponentType<any> | ContentConfig;
}

export interface DashboardConfig {
  title: string;
  description: string;
  stats?: Array<{
    label: string;
    value: string | number;
    icon: string;
    color: string;
  }>;
  quickActions?: Array<{
    title: string;
    description: string;
    icon: string;
    color: string;
    onClick?: () => void;
  }>;
  recentActivity?: Array<{
    type: "success" | "info" | "warning" | "error";
    message: string;
    timestamp: string;
  }>;
}

export interface ContentRegistry {
  content: ContentConfig;
  dashboards: {
    [key: string]: DashboardConfig;
  };
  defaultContent?: ComponentType<any>;
}
