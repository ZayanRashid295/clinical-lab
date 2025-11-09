import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { Badge } from "@/shared/ui/badge";

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
    <Card data-testid="card-progress" className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{title}</CardTitle>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-progress-value">
            {current} / {total}
          </span>
          {daysRemaining !== undefined && (
            <span className="text-sm text-gray-600 dark:text-gray-400">{daysRemaining} days remaining</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">{progress}%</span>
          </div>
          
          {stats && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                Completed {stats.completed}
              </Badge>
              <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700">
                Overdue {stats.overdue}
              </Badge>
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                Incomplete {stats.incomplete}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

