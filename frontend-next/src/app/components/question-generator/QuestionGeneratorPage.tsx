"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import useAccessControl from "@/hooks/useAccessControl";
import QuestionGeneratorAdmin from "./QuestionGeneratorAdmin";

const ADMIN_ROLES = ["ADMIN", "SUPERADMIN"];

export default function QuestionGeneratorPage() {
  const router = useRouter();
  const { loading, hasAccess } = useAccessControl();

  useEffect(() => {
    if (loading) return;
    if (!hasAccess({ role: ADMIN_ROLES })) {
      void router.replace("/study/question-bank");
    }
  }, [loading, hasAccess, router]);

  if (loading || !hasAccess({ role: ADMIN_ROLES })) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <QuestionGeneratorAdmin />;
}
