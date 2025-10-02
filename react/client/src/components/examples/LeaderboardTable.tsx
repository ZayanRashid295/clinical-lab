import { LeaderboardTable } from '../LeaderboardTable'

export default function LeaderboardTableExample() {
  const mockEntries = [
    { rank: 1, name: "Sarah Chen", specialty: "Internal Medicine", eloRating: 1845, casesCompleted: 127 },
    { rank: 2, name: "Michael Rodriguez", specialty: "Emergency Med", eloRating: 1823, casesCompleted: 115 },
    { rank: 3, name: "Emily Johnson", specialty: "Pediatrics", eloRating: 1801, casesCompleted: 98 },
  ];

  return <LeaderboardTable entries={mockEntries} />
}
