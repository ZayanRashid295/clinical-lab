"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { MoreVertical, Play, BarChart3, FileText } from "lucide-react";

interface Test {
  id: string;
  score: number;
  name: string;
  date: string;
  mode: string;
  pool: string;
  subjects: string;
  systems: string;
  questionCount: number;
}

interface TestTableProps {
  tests: Test[];
  onResume?: (testId: string) => void;
  onViewResults?: (testId: string) => void;
  onViewAnalysis?: (testId: string) => void;
}

export function TestTable({
  tests,
  onResume,
  onViewResults,
  onViewAnalysis,
}: TestTableProps) {
  const getScoreBadgeClassName = (score: number) => {
    if (score > 90) {
      // Success green - solid green background with white text
      return "font-mono border-transparent bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600";
    } else if (score > 80) {
      // Warning orange - solid orange background with white text
      return "font-mono border-transparent bg-orange-600 dark:bg-orange-500 text-white hover:bg-orange-700 dark:hover:bg-orange-600";
    } else {
      // Error red - solid red background with white text
      return "font-mono border-transparent bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600";
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/5">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-white/5">
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100">SCORE</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100">NAME</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100">DATE</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100">MODE</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100">Q.POOL</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100">SUBJECTS</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100">SYSTEMS</TableHead>
            <TableHead className="font-semibold text-gray-900 dark:text-slate-100"># QS</TableHead>
            <TableHead className="text-right font-semibold text-gray-900 dark:text-slate-100">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="py-8 text-center text-muted-foreground dark:text-slate-400"
              >
                No tests found
              </TableCell>
            </TableRow>
          ) : (
            tests.map((test) => (
              <TableRow
                key={test.id}
                className="hover:bg-slate-50 dark:hover:bg-white/5"
                data-testid={`row-test-${test.id}`}
              >
                <TableCell>
                  <Badge
                    className={getScoreBadgeClassName(test.score)}
                    data-testid={`badge-score-${test.id}`}
                  >
                    {test.score}%
                  </Badge>
                </TableCell>
                <TableCell
                  className="font-medium text-gray-900 dark:text-slate-100"
                  data-testid={`text-name-${test.id}`}
                >
                  {test.name}
                </TableCell>
                <TableCell className="text-muted-foreground dark:text-slate-400">
                  {test.date}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-slate-200">{test.mode}</TableCell>
                <TableCell className="text-gray-900 dark:text-slate-200">{test.pool}</TableCell>
                <TableCell className="text-gray-900 dark:text-slate-200">{test.subjects}</TableCell>
                <TableCell className="text-gray-900 dark:text-slate-200">{test.systems}</TableCell>
                <TableCell className="font-mono text-gray-900 dark:text-slate-200">
                  {test.questionCount}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResume?.(test.id)}
                      className="text-gray-900 hover:bg-muted dark:text-slate-200 dark:hover:bg-white/10"
                      data-testid={`button-resume-${test.id}`}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewResults?.(test.id)}
                      className="text-gray-900 hover:bg-muted dark:text-slate-200 dark:hover:bg-white/10"
                      data-testid={`button-results-${test.id}`}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Results
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewAnalysis?.(test.id)}
                      className="text-gray-900 hover:bg-muted dark:text-slate-200 dark:hover:bg-white/10"
                      data-testid={`button-analysis-${test.id}`}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analysis
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-menu-${test.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/5">
                        <DropdownMenuItem className="text-gray-900 hover:bg-muted dark:text-slate-200 dark:hover:bg-white/10">Edit Test Mode</DropdownMenuItem>
                        <DropdownMenuItem className="text-gray-900 hover:bg-muted dark:text-slate-200 dark:hover:bg-white/10">Copy Test ID</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/20">
                          Delete Test
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
