import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ProgressCardProps {
  title: string;
  progress: number;
  current: number;
  total: number;
  daysRemaining?: number;
  stats?: {
    completed: number;
    overdue: number;
    incomplete: number;
  };
}

export function ProgressCard({
  title,
  progress,
  current,
  total,
  daysRemaining,
  stats,
}: ProgressCardProps) {
  return (
    <Card data-testid="card-progress">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-2xl font-bold" data-testid="text-progress-value">
            {current} / {total}
          </span>
          {daysRemaining !== undefined && (
            <span className="text-sm text-muted-foreground">{daysRemaining} days remaining</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm font-medium tabular-nums">{progress}%</span>
          </div>
          
          {stats && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                Completed {stats.completed}
              </Badge>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                Overdue {stats.overdue}
              </Badge>
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                Incomplete {stats.incomplete}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
