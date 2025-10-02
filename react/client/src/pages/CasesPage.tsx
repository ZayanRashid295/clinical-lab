import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CaseCard } from "@/components/CaseCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Case } from "@shared/schema";

export default function CasesPage() {
  const [specialty, setSpecialty] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['/api/cases', specialty, difficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (specialty !== 'all') params.append('specialty', specialty);
      if (difficulty !== 'all') params.append('difficulty', difficulty);
      const response = await fetch(`/api/cases?${params}`);
      if (!response.ok) throw new Error('Failed to fetch cases');
      return response.json();
    },
  });

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="student" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          
          <main className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Case Library</h1>
                {!isLoading && (
                  <p className="text-sm text-muted-foreground" data-testid="text-cases-count">
                    {cases.length} {cases.length === 1 ? 'case' : 'cases'} available
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Specialty</label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger className="w-full" data-testid="select-specialty">
                      <SelectValue placeholder="All Specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      <SelectItem value="Cardiology">Cardiology</SelectItem>
                      <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                      <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                      <SelectItem value="Neurology">Neurology</SelectItem>
                      <SelectItem value="Pulmonology">Pulmonology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="w-full" data-testid="select-difficulty">
                      <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading cases...</p>
                </div>
              ) : cases.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No cases found matching your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cases.map((caseItem) => (
                    <CaseCard key={caseItem.id} {...caseItem} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
