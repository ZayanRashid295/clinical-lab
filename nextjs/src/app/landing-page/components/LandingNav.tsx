"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/shared/components/theme-toggle/theme-toggle";
import { Stethoscope, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeaderboardTable } from "./LeaderboardTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LandingNavProps {
  onLoginClick?: () => void;
}

export function LandingNav({ onLoginClick }: LandingNavProps) {
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      // Navigate to login page in Next.js
      window.location.href = "/login";
    }
  };

  const handleSignup = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      // Navigate to login page in Next.js
      window.location.href = "/login";
    }
  };

  const globalEntries = [
    {
      rank: 1,
      name: "Sarah Chen",
      specialty: "Internal Medicine",
      eloRating: 1845,
      casesCompleted: 127,
    },
    {
      rank: 2,
      name: "Michael Rodriguez",
      specialty: "Emergency Med",
      eloRating: 1823,
      casesCompleted: 115,
    },
    {
      rank: 3,
      name: "Emily Johnson",
      specialty: "Pediatrics",
      eloRating: 1801,
      casesCompleted: 98,
    },
    {
      rank: 4,
      name: "David Kim",
      specialty: "Surgery",
      eloRating: 1798,
      casesCompleted: 105,
    },
    {
      rank: 5,
      name: "Jessica Martinez",
      specialty: "Internal Medicine",
      eloRating: 1776,
      casesCompleted: 92,
    },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Clinical Lab</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md transition"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md transition"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md transition"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeaderboardOpen(true)}
              data-testid="button-leaderboard"
            >
              <Trophy className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={handleLogin}
              data-testid="button-login"
            >
              Log In
            </Button>
            <Button onClick={handleSignup} data-testid="button-signup">
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Leaderboard
            </DialogTitle>
          </DialogHeader>
          <Tabs
            defaultValue="global"
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList>
              <TabsTrigger value="global" data-testid="tab-global">
                Global
              </TabsTrigger>
              <TabsTrigger value="cohort" data-testid="tab-cohort">
                My Cohort
              </TabsTrigger>
              <TabsTrigger value="specialty" data-testid="tab-specialty">
                By Specialty
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="global" className="m-0">
                <LeaderboardTable entries={globalEntries} />
              </TabsContent>

              <TabsContent value="cohort" className="m-0">
                <LeaderboardTable entries={globalEntries.slice(0, 3)} />
              </TabsContent>

              <TabsContent value="specialty" className="m-0">
                <LeaderboardTable entries={globalEntries.slice(0, 3)} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
