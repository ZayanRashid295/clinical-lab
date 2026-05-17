"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { authService } from "@/shared/services/auth.service";
import { userHasRole } from "@/lib/auth/post-login-route";
import { Loader2 } from "lucide-react";

export function FacultyGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const roles = (user as { roles?: string[] })?.roles ?? [];
    if (!authService.isAuthenticated()) {
      router.replace("/?auth=login");
      return;
    }
    if (!userHasRole(roles, "FACULTY") && !userHasRole(roles, "SUPERADMIN")) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return <>{children}</>;
}
