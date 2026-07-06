"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

/** Legacy checkout URL — redirects to pricing with subscription modal deep link. */
export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const planId = router.query.planId as string | undefined;
    const interval = (router.query.interval as string) || "MONTHLY";
    const promo = router.query.promo as string | undefined;
    const params = new URLSearchParams();
    if (planId) params.set("planId", planId);
    params.set("interval", interval);
    if (promo) params.set("promo", promo);
    router.replace(`/pricing?${params.toString()}`);
  }, [router]);

  return <div className="py-16 text-center text-gray-500">Redirecting to pricing...</div>;
}
