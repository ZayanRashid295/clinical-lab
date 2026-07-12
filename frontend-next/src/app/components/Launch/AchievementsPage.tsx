"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

/** Legacy route — achievements live on the dashboard. */
export default function AchievementsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace("/dashboard#achievements");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-16 text-sm text-slate-500 dark:text-slate-400">
      Redirecting to dashboard…
    </div>
  );
}
