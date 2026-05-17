"use client";

import { useEffect, useState } from "react";
import { facultyApiService } from "@/app/services/faculty/faculty-api.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const MODES = ["LEARNING", "PRACTICE", "AI_EVALUATION", "SHADOW"];

export function FacultyCasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [disease, setDisease] = useState("");
  const [mode, setMode] = useState("LEARNING");

  const reload = () => void facultyApiService.listCases().then(setCases);

  useEffect(() => {
    reload();
  }, []);

  const create = async () => {
    if (!title.trim() || !disease.trim()) return;
    await facultyApiService.createCase({
      title,
      disease,
      diseaseName: disease,
      mode,
      symptoms: ["Fever", "Fatigue"],
    });
    setTitle("");
    setDisease("");
    reload();
  };

  const publish = async (id: string) => {
    await facultyApiService.publishCase(id);
    reload();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {cases.map((c) => (
          <Card key={c.id} className="dark:border-white/10 dark:bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{c.title}</CardTitle>
                <p className="text-sm text-slate-500">{c.disease}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{c.mode}</Badge>
                <Badge>{c.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {c.status === "DRAFT" && (
                <Button size="sm" onClick={() => void publish(c.id)}>
                  Publish
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle>New institution case</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            placeholder="Disease / chief complaint"
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
          />
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger>
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full" onClick={() => void create()}>
            Save draft
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
