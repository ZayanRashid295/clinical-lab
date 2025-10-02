import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBubble } from "./ChatBubble";
import { useState } from "react";
import { Send, Stethoscope, TestTube, FileText } from "lucide-react";

export function ClinicalInterviewPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "patient" | "doctor" | "system"; message: string; timestamp?: string }>>([
    { role: "system" as const, message: "Case started: 45-year-old male with chest pain" },
    { role: "patient" as const, message: "Hello doctor, I've been having chest pain.", timestamp: "2:30 PM" },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "doctor" as const, message: input, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "patient" as const, 
        message: "The pain started about an hour ago. It's a sharp pain in the center of my chest.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="history" className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <TabsList>
            <TabsTrigger value="history" data-testid="tab-history">
              <Stethoscope className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="exam" data-testid="tab-exam">
              <Stethoscope className="h-4 w-4 mr-2" />
              Physical Exam
            </TabsTrigger>
            <TabsTrigger value="investigations" data-testid="tab-investigations">
              <TestTube className="h-4 w-4 mr-2" />
              Investigations
            </TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">
              <FileText className="h-4 w-4 mr-2" />
              SOAP Notes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="history" className="flex-1 flex flex-col m-0">
          <ScrollArea className="flex-1 p-4">
            {messages.map((msg, idx) => (
              <ChatBubble key={idx} {...msg} />
            ))}
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question or response..."
                className="resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                data-testid="input-chat"
              />
              <Button onClick={handleSend} size="icon" data-testid="button-send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exam" className="flex-1 p-4 m-0">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-exam-general">
              <Stethoscope className="h-6 w-6" />
              General Exam
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-exam-cardiovascular">
              <Stethoscope className="h-6 w-6" />
              Cardiovascular
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-exam-respiratory">
              <Stethoscope className="h-6 w-6" />
              Respiratory
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-exam-abdominal">
              <Stethoscope className="h-6 w-6" />
              Abdominal
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="investigations" className="flex-1 p-4 m-0">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" data-testid="button-order-ecg">
              <TestTube className="h-4 w-4 mr-2" />
              Order ECG
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-order-bloodwork">
              <TestTube className="h-4 w-4 mr-2" />
              Order Blood Work
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-order-xray">
              <TestTube className="h-4 w-4 mr-2" />
              Order Chest X-Ray
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="flex-1 p-4 m-0">
          <Textarea
            placeholder="Document your SOAP notes here..."
            className="h-full min-h-[400px] font-mono"
            data-testid="input-soap-notes"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
