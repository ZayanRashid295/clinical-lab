import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatBubbleProps {
  role: "patient" | "doctor" | "system";
  message: string;
  timestamp?: string;
}

export function ChatBubble({ role, message, timestamp }: ChatBubbleProps) {
  const isDoctor = role === "doctor";
  const isSystem = role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground">
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3 mb-4", isDoctor && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback className={isDoctor ? "bg-primary text-primary-foreground" : "bg-secondary"}>
          {isDoctor ? "D" : "P"}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex flex-col gap-1 max-w-[70%]", isDoctor && "items-end")}>
        <div 
          className={cn(
            "rounded-lg px-4 py-3",
            isDoctor 
              ? "bg-primary/10 text-foreground" 
              : "bg-secondary text-secondary-foreground"
          )}
        >
          <p className="text-sm">{message}</p>
        </div>
        {timestamp && (
          <span className="text-xs text-muted-foreground px-2">{timestamp}</span>
        )}
      </div>
    </div>
  );
}
