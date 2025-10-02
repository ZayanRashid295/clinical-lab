import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface TimelineEventProps {
  action: string;
  timestamp: string;
  status: "correct" | "incorrect" | "suboptimal";
  feedback?: string;
  isLast?: boolean;
}

export function TimelineEvent({ action, timestamp, status, feedback, isLast = false }: TimelineEventProps) {
  const statusConfig = {
    correct: {
      icon: CheckCircle2,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    incorrect: {
      icon: XCircle,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    suboptimal: {
      icon: AlertCircle,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
      </div>
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{action}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        {feedback && (
          <p className="text-sm text-muted-foreground mt-1">{feedback}</p>
        )}
      </div>
    </div>
  );
}
