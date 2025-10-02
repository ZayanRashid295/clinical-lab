import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  unlocked?: boolean;
}

export function AchievementBadge({ icon: Icon, title, description, unlocked = false }: AchievementBadgeProps) {
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-all",
        unlocked 
          ? "bg-card border-card-border hover-elevate" 
          : "bg-muted/30 border-border opacity-60"
      )}
    >
      <div className={cn(
        "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0",
        unlocked ? "bg-primary/10" : "bg-muted"
      )}>
        <Icon className={cn("h-6 w-6", unlocked ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
        {unlocked && (
          <Badge variant="secondary" className="mt-2 bg-chart-3/10 text-chart-3">Unlocked</Badge>
        )}
      </div>
    </div>
  );
}
