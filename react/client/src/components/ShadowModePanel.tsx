import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBubble } from "./ChatBubble";
import { Pause, Play, SkipForward, MessageCircleQuestion, Target, Lightbulb, CheckCircle2, BookOpen } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function ShadowModePanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);

  const conversation = [
    { role: "doctor" as const, message: "Good morning! I'm Dr. Smith. What brings you in today?", timestamp: "0:05" },
    { role: "patient" as const, message: "I've been having chest pain for the past hour.", timestamp: "0:08" },
    { role: "system" as const, message: "⭐ Teachable Moment: Notice the open-ended opening question" },
    { role: "doctor" as const, message: "I'm sorry to hear that. Can you describe the pain for me? Where exactly is it located?", timestamp: "0:15" },
    { role: "patient" as const, message: "It's right in the center of my chest, and it feels sharp.", timestamp: "0:20" },
    { role: "system" as const, message: "⭐ Teachable Moment: Establishing timeline is crucial for understanding symptom progression" },
    { role: "doctor" as const, message: "Can you describe the pain/symptoms in more detail? What does it feel like?", timestamp: "0:30" },
    { role: "patient" as const, message: "It's a heavy, squeezing sensation in the center of my chest. It also goes into my left arm and jaw.", timestamp: "0:35" },
    { role: "system" as const, message: "⭐ Teachable Moment: Asking about modifying factors helps narrow differential diagnosis" },
  ];

  const learningObjectives = [
    "Perform a focused cardiovascular history",
    "Assess cardiac risk factors",
    "Differentiate between cardiac and non-cardiac chest pain",
    "Demonstrate appropriate communication skills"
  ];

  const keyInsights = [
    "Notice the open-ended question to encourage the patient to share freely",
    "Establishing timeline is crucial for understanding symptom progression",
    "Asking about modifying factors helps narrow differential diagnosis",
    "Past medical history can reveal important risk factors"
  ];

  const teachableMoments = [
    { timestamp: "0:05", moment: "Open-ended opening question encourages patient to share freely" },
    { timestamp: "0:15", moment: "Establishing timeline is crucial for symptom progression" },
    { timestamp: "0:30", moment: "Asking about modifying factors narrows differential diagnosis" }
  ];

  const learningPoints = [
    "Chest pain assessment requires systematic evaluation of quality, location, radiation, and associated symptoms",
    "Red flag symptoms include radiation to jaw/arm, diaphoresis, and dyspnea",
    "Risk stratification should consider patient age, cardiovascular risk factors, and symptom characteristics",
    "Open-ended questions followed by focused clarification optimizes information gathering"
  ];

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col border-r">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Acute Chest Pain in a 55-Year-Old Male</h3>
              <p className="text-sm text-muted-foreground">A 55-year-old male presents to the emergency department with acute onset chest pain that started 2 hours ago.</p>
            </div>
            <Badge className="bg-chart-2/10 text-chart-2">In Progress</Badge>
          </div>
          <div className="flex gap-2 mb-3">
            <Badge variant="secondary">Cardiology</Badge>
            <Badge variant="secondary">Intermediate</Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" data-testid="button-skip">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowQuestion(!showQuestion)}
              data-testid="button-ask-question"
            >
              <MessageCircleQuestion className="h-4 w-4 mr-2" />
              Ask Question
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {conversation.map((msg, idx) => (
            <ChatBubble key={idx} {...msg} />
          ))}
          
          {showQuestion && (
            <Card className="p-4 bg-accent/50 mt-4">
              <p className="text-sm font-medium mb-2">Your Question:</p>
              <p className="text-sm text-muted-foreground mb-3">
                "Why did the doctor ask about the location of pain first?"
              </p>
              <p className="text-sm">
                <strong>AI Explanation:</strong> Asking about pain location is crucial for differential diagnosis. 
                Central chest pain suggests cardiac or esophageal causes, while lateral pain might indicate 
                musculoskeletal or pleural issues. This helps narrow down the diagnostic possibilities early.
              </p>
            </Card>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/3" />
            </div>
            <span className="font-mono">5:42 / 18:30</span>
          </div>
        </div>
      </div>

      <div className="w-80 flex flex-col bg-muted/20">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Learning Objectives
              </h4>
              <div className="space-y-2">
                {learningObjectives.map((objective, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">{objective}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-chart-3" />
                Key Insights
              </h4>
              <div className="space-y-3">
                {keyInsights.map((insight, idx) => (
                  <Card key={idx} className="p-3 bg-chart-3/5 border-chart-3/20">
                    <p className="text-sm">{insight}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-chart-2" />
                Teachable Moments
              </h4>
              <div className="space-y-2">
                {teachableMoments.map((item, idx) => (
                  <div key={idx} className="border-l-2 border-chart-2 pl-3 py-1">
                    <p className="text-xs text-muted-foreground font-mono mb-1">{item.timestamp}</p>
                    <p className="text-sm">{item.moment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Learning Points
              </h4>
              <div className="space-y-3">
                {learningPoints.map((point, idx) => (
                  <Card key={idx} className="p-3 bg-primary/5 border-primary/20">
                    <p className="text-sm">{point}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <Card className="p-3 bg-chart-2/10 border-chart-2/20">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-chart-2">Case Complete!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You've observed a complete clinical interview. Try the Interview Mode to practice yourself!
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
