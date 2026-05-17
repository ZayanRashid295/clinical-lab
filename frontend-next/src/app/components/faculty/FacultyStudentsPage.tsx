"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { facultyApiService } from "@/app/services/faculty/faculty-api.service";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export function FacultyStudentsPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      void facultyApiService.listStudents(search || undefined).then(setRows);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search students…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cases</TableHead>
              <TableHead>Avg score</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {s.firstName} {s.lastName}
                </TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s.medprepCasesCompleted ?? 0}</TableCell>
                <TableCell>
                  {s.avgMedprepScore != null
                    ? Math.round(s.avgMedprepScore)
                    : "—"}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/faculty/students/${s.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
