import { useEffect } from "react";
import { useRouter } from "next/router";
import { authService } from "../src/shared";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication status and redirect appropriately
    // Use replace instead of push to avoid polluting browser history
    if (!authService.isAuthenticated()) {
      router.replace("/login");
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
