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

export function FacultyAssignmentsPage() {
  const [list, setList] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");

  const reload = () => void facultyApiService.listAssignments().then(setList);

  useEffect(() => {
    reload();
  }, []);

  const create = async () => {
    if (!title.trim()) return;
    await facultyApiService.createAssignment({
      title,
      instructions,
      dueAt: dueAt || undefined,
      type: "MIXED",
    });
    setTitle("");
    setInstructions("");
    setDueAt("");
    reload();
  };

  const publish = async (id: string) => {
    await facultyApiService.publishAssignment(id);
    reload();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        {list.map((a) => (
          <Card key={a.id} className="dark:border-white/10 dark:bg-white/5">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{a.title}</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  {a._count?.progress ?? 0} students ·{" "}
                  {a.dueAt ? `Due ${new Date(a.dueAt).toLocaleDateString()}` : "No due date"}
                </p>
              </div>
              <Badge>{a.status}</Badge>
            </CardHeader>
            <CardContent className="flex gap-2">
              {a.status === "DRAFT" && (
                <Button size="sm" onClick={() => void publish(a.id)}>
                  Publish to roster
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle>New assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
          <Button className="w-full" onClick={() => void create()}>
            Save draft
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
