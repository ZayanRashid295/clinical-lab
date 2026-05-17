"use client";

import { useEffect, useState } from "react";
import { facultyApiService } from "@/app/services/faculty/faculty-api.service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function FacultyComparePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any[] | null>(null);

  useEffect(() => {
    void facultyApiService.listStudents().then(setStudents);
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 8),
    );
  };

  const runCompare = async () => {
    if (selected.length < 2) return;
    const res = await facultyApiService.compareStudents(selected);
    setComparison(res?.students ?? []);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Select up to 8 students to compare MedPrep completion and scores.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((s) => (
          <label
            key={s.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10"
          >
            <Checkbox
              checked={selected.includes(s.id)}
              onCheckedChange={() => toggle(s.id)}
            />
            <span className="text-sm font-medium">
              {s.firstName} {s.lastName}
            </span>
          </label>
        ))}
      </div>
      <Button disabled={selected.length < 2} onClick={() => void runCompare()}>
        Compare ({selected.length})
      </Button>

      {comparison && (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Cases completed</TableHead>
                <TableHead>Avg score</TableHead>
                <TableHead>Hints used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((row) => (
                <TableRow key={row.user?.id}>
                  <TableCell>
                    {row.user?.firstName} {row.user?.lastName}
                  </TableCell>
                  <TableCell>{row.casesCompleted ?? 0}</TableCell>
                  <TableCell>
                    {row.avgScore != null ? Math.round(row.avgScore) : "—"}
                  </TableCell>
                  <TableCell>{row.totalHints ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
