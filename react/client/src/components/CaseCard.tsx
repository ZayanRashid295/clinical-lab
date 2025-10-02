import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Stethoscope, Play, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

interface CaseCardProps {
  id: string;
  title: string;
  description: string;
  specialty: string;
  difficulty: string;
  duration: number;
}

export function CaseCard({ 
  id, 
  title, 
  description,
  specialty, 
  difficulty, 
  duration,
}: CaseCardProps) {
  const [, setLocation] = useLocation();

  const difficultyColors = {
    beginner: "bg-green-500/20 text-green-400 border-green-500/30",
    intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    advanced: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const handleShadowMode = () => {
    setLocation(`/case/${id}?mode=shadow`);
  };

  const handleInterviewMode = () => {
    setLocation(`/case/${id}?mode=interview`);
  };

  return (
    <Card className="p-6 hover-elevate transition-all bg-card/50" data-testid={`card-case-${id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              {specialty}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {duration} min
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Badge 
            variant="outline" 
            className={difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.intermediate}
          >
            {difficulty}
          </Badge>
          <div className="flex flex-col gap-2 w-40">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShadowMode}
              className="w-full justify-start gap-2"
              data-testid={`button-shadow-${id}`}
            >
              <Play className="h-4 w-4" />
              Shadow Mode
            </Button>
            <Button 
              size="sm" 
              onClick={handleInterviewMode}
              className="w-full justify-start gap-2"
              data-testid={`button-interview-${id}`}
            >
              <MessageSquare className="h-4 w-4" />
              Interview Mode
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
