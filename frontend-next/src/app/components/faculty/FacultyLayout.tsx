"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Users,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { APP_PAGE_SHELL } from "@/app/config/app-shell";
import { authService } from "@/shared/services/auth.service";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/faculty", label: "Command Center", icon: LayoutDashboard },
  { href: "/faculty/students", label: "Students", icon: Users },
  { href: "/faculty/compare", label: "Compare", icon: BarChart3 },
  { href: "/faculty/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/faculty/cases", label: "Case Studio", icon: BookOpen },
  { href: "/faculty/questions", label: "Institution QBank", icon: GraduationCap },
  { href: "/faculty/messages", label: "Messages", icon: MessageSquare },
];

export function FacultyLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const path = router.asPath.split("?")[0];

  const logout = async () => {
    await authService.logout();
    router.replace("/");
  };

  return (
    <div className={cn(APP_PAGE_SHELL, "flex min-h-screen")}>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/80 lg:flex">
        <div className="border-b border-slate-200 px-5 py-6 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            MedPrepAI
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            Faculty Workspace
          </h2>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/faculty"
                ? path === "/faculty"
                : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-600 dark:text-slate-300"
            onClick={() => void logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/60 sm:px-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {title ?? "Faculty"}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
