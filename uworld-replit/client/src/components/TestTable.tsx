import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function TestTable({ tests, onResume, onViewResults, onViewAnalysis }: TestTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden" data-testid="table-tests">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">SCORE</TableHead>
            <TableHead className="font-semibold">NAME</TableHead>
            <TableHead className="font-semibold">DATE</TableHead>
            <TableHead className="font-semibold">MODE</TableHead>
            <TableHead className="font-semibold">Q.POOL</TableHead>
            <TableHead className="font-semibold">SUBJECTS</TableHead>
            <TableHead className="font-semibold">SYSTEMS</TableHead>
            <TableHead className="font-semibold"># QS</TableHead>
            <TableHead className="font-semibold text-right">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => (
            <TableRow key={test.id} className="hover-elevate" data-testid={`row-test-${test.id}`}>
              <TableCell>
                <Badge
                  variant={test.score >= 70 ? "default" : "destructive"}
                  className="font-mono"
                  data-testid={`badge-score-${test.id}`}
                >
                  {test.score}%
                </Badge>
              </TableCell>
              <TableCell className="font-medium" data-testid={`text-name-${test.id}`}>{test.name}</TableCell>
              <TableCell className="text-muted-foreground">{test.date}</TableCell>
              <TableCell>{test.mode}</TableCell>
              <TableCell>{test.pool}</TableCell>
              <TableCell>{test.subjects}</TableCell>
              <TableCell>{test.systems}</TableCell>
              <TableCell className="font-mono">{test.questionCount}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResume?.(test.id)}
                    data-testid={`button-resume-${test.id}`}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewResults?.(test.id)}
                    data-testid={`button-results-${test.id}`}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Results
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewAnalysis?.(test.id)}
                    data-testid={`button-analysis-${test.id}`}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analysis
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-menu-${test.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Test Mode</DropdownMenuItem>
                      <DropdownMenuItem>Copy Test ID</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete Test</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
