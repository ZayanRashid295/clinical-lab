"use client";

import React from "react";

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
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium text-muted-foreground">
                Rank
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground">
                Name
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground">
                Specialty
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground">
                Elo Rating
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground">
                Cases
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.rank} className="border-b hover:bg-muted/50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">
                      #{entry.rank}
                    </span>
                  </div>
                </td>
                <td className="p-3 font-medium">{entry.name}</td>
                <td className="p-3 text-muted-foreground">{entry.specialty}</td>
                <td className="p-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {entry.eloRating}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {entry.casesCompleted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
