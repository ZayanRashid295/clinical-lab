"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/shared/ui/button";
import {
  Stethoscope,
  Trophy,
  Sun,
  Moon,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { authService } from "@/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { LeaderboardTable } from "./LeaderboardTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { cn } from "@/shared/utils/cn";

interface LandingNavProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#categories", label: "Programs" },
  { href: "#modes", label: "Modes" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

const globalEntries = [
  { rank: 1, name: "Sarah Chen", specialty: "Internal Medicine", eloRating: 1845, casesCompleted: 127 },
  { rank: 2, name: "Michael Rodriguez", specialty: "Emergency Med", eloRating: 1823, casesCompleted: 115 },
  { rank: 3, name: "Emily Johnson", specialty: "Pediatrics", eloRating: 1801, casesCompleted: 98 },
  { rank: 4, name: "David Kim", specialty: "Surgery", eloRating: 1798, casesCompleted: 105 },
  { rank: 5, name: "Jessica Martinez", specialty: "Internal Medicine", eloRating: 1776, casesCompleted: 92 },
];

export function LandingNav({ onLoginClick, onSignupClick }: LandingNavProps) {
  const router = useRouter();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { config, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const checkAuth = async () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        try {
          const profile = await authService.getProfile();
          const name =
            profile?.firstName && profile?.lastName
              ? `${profile.firstName} ${profile.lastName}`
              : profile?.email?.split("@")[0] || "User";
          setUserName(name);
        } catch {
          setUserName(null);
        }
      } else {
        setUserName(null);
      }
    };
    void checkAuth();
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    const interval = setInterval(() => void checkAuth(), 3000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearInterval(interval);
    };
  }, []);

  const handleLogin = () => {
    setMobileOpen(false);
    if (onLoginClick) onLoginClick();
    else void router.push("/auth");
  };

  const handleSignup = () => {
    setMobileOpen(false);
    if (onSignupClick) onSignupClick();
    else void router.push("/auth?mode=signup");
  };

  const handleDashboard = () => {
    setMobileOpen(false);
    void router.push("/dashboard");
  };

  const scrollTo = (hash: string) => {
    setMobileOpen(false);
    const el = document.querySelector(hash);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b border-white/10 bg-slate-950/90 shadow-lg backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-900/40">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">MedPrepAI</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(link.href);
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() => setLeaderboardOpen(true)}
              aria-label="Leaderboard"
            >
              <Trophy className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() =>
                setTheme(config.theme === "light" ? "dark" : "light")
              }
              aria-label="Toggle theme"
            >
              {mounted && config.theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-slate-400 md:inline">
                  {userName}
                </span>
                <Button
                  onClick={handleDashboard}
                  className="hidden bg-primary-600 hover:bg-primary-500 sm:inline-flex"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="hidden text-slate-200 hover:bg-white/10 sm:inline-flex"
                  onClick={handleLogin}
                >
                  Log in
                </Button>
                <Button
                  className="hidden bg-primary-600 hover:bg-primary-500 sm:inline-flex"
                  onClick={handleSignup}
                >
                  Sign up
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-xl lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(link.href);
                  }}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
              {isAuthenticated ? (
                <Button onClick={handleDashboard} className="w-full">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full" onClick={handleLogin}>
                    Log in
                  </Button>
                  <Button className="w-full" onClick={handleSignup}>
                    Sign up free
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary-500" />
              Leaderboard preview
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="global" className="flex flex-col overflow-hidden">
            <TabsList>
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="cohort">Cohort</TabsTrigger>
            </TabsList>
            <TabsContent value="global" className="mt-4 overflow-auto">
              <LeaderboardTable entries={globalEntries} />
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Sign in to compete on live leaderboards.
              </p>
            </TabsContent>
            <TabsContent value="cohort" className="mt-4">
              <LeaderboardTable entries={globalEntries.slice(0, 3)} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
