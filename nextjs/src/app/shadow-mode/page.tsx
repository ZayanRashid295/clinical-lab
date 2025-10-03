"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShadowModePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main dashboard that handles content switching
    router.replace("/main-dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading Shadow Mode...</p>
      </div>
    </div>
  );
}
