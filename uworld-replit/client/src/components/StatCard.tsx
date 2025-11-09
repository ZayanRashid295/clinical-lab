import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
    primary: "text-primary",
    success: "text-chart-2",
    warning: "text-chart-4",
  };

  return (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {progress !== undefined && (
          <Progress value={progress} className="mt-3" />
        )}
      </CardContent>
    </Card>
  );
}
