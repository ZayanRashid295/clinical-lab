import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  specialty: string;
  eloRating: number;
  casesCompleted: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium">{rank}</span>;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead className="text-right">Elo Rating</TableHead>
            <TableHead className="text-right">Cases</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.rank} data-testid={`row-leaderboard-${entry.rank}`}>
              <TableCell className="font-medium">
                <div className="flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{entry.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{entry.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{entry.specialty}</Badge>
              </TableCell>
              <TableCell className="text-right font-mono font-medium">{entry.eloRating}</TableCell>
              <TableCell className="text-right text-muted-foreground">{entry.casesCompleted}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
