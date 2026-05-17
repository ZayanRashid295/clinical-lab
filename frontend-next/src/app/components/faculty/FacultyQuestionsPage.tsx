"use client";

import { useEffect, useState } from "react";
import { facultyApiService } from "@/app/services/faculty/faculty-api.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function FacultyQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [stem, setStem] = useState("");
  const [choices, setChoices] = useState("A|B|C|D");
  const [correct, setCorrect] = useState("0");

  const reload = () => {
    void facultyApiService.listQuestions().then(setQuestions);
    void facultyApiService.listQuestionSets().then(setSets);
  };

  useEffect(() => {
    reload();
  }, []);

  const create = async () => {
    if (!stem.trim()) return;
    const options = choices.split("|").map((t, i) => ({
      text: t.trim(),
      isCorrect: String(i) === correct,
    }));
    await facultyApiService.createQuestion({
      question: stem,
      choices: options,
    });
    setStem("");
    reload();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">Question sets</h3>
        {sets.map((s) => (
          <Card key={s.id} className="dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="text-base">{s.title}</CardTitle>
              <Badge variant="outline">{s._count?.questions ?? 0} questions</Badge>
            </CardHeader>
          </Card>
        ))}
        <h3 className="pt-4 font-semibold text-slate-900 dark:text-white">Questions</h3>
        {questions.map((q) => (
          <Card key={q.id} className="dark:border-white/10 dark:bg-white/5">
            <CardContent className="pt-6">
              <p className="text-sm">{q.question}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle>Add MCQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea placeholder="Question stem" value={stem} onChange={(e) => setStem(e.target.value)} />
          <Input
            placeholder="Choices separated by |"
            value={choices}
            onChange={(e) => setChoices(e.target.value)}
          />
          <Input
            placeholder="Correct index (0-based)"
            value={correct}
            onChange={(e) => setCorrect(e.target.value)}
          />
          <Button className="w-full" onClick={() => void create()}>
            Add question
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
