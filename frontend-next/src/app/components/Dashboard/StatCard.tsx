import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  progress?: number;
  color?: "primary" | "success" | "warning";
}

export function StatCard({ title, value, subtitle, icon: Icon, progress, color = "primary" }: StatCardProps) {
  const colorClasses = {
    primary: "text-primary-600 dark:text-primary-400",
    success: "text-primary-700 dark:text-primary-300",
    warning: "text-primary-500 dark:text-primary-400",
  };

  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
        {subtitle && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
        {progress !== undefined && (
          <Progress value={progress} className="mt-3" />
        )}
      </CardContent>
    </Card>
  );
}

