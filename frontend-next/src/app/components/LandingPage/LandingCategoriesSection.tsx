"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CategoriesService } from "@/app/services/categories/categories.service";
import type { Category, CategoryProduct } from "@/app/types/category";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/ui/button";
import { ArrowRight, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface LandingCategoriesSectionProps {
  isAuthenticated: boolean;
  onGetStarted: () => void;
}

export function LandingCategoriesSection({
  isAuthenticated,
  onGetStarted,
}: LandingCategoriesSectionProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.08 });

  useEffect(() => {
    const load = async () => {
      try {
        const service = new CategoriesService();
        const data = await service.getCategoriesPublic();
        setCategories(data);
        if (data.length > 0) setActiveId(data[0].id);
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const active = categories.find((c) => c.id === activeId) ?? categories[0];
  const products: CategoryProduct[] = active?.products ?? [];

  const openProduct = () => {
    if (isAuthenticated) {
      void router.push("/dashboard");
    } else {
      onGetStarted();
    }
  };

  if (!loading && categories.length === 0) return null;

  return (
    <section
      id="categories"
      ref={ref}
      className="relative border-y border-white/5 bg-slate-950 py-20 sm:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(var(--color-primary-500-rgb,16,185,129),0.12),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "mb-10 max-w-2xl transition-all duration-700",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
            Learning paths
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Explore by specialty & program
          </h2>
          <p className="mt-3 text-lg text-slate-400">
            Browse categories your institution configures—FCPS, nursing, allied
            health, and more—all in one platform.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
          </div>
        ) : (
          <div
            className={cn(
              "transition-all duration-700 delay-100",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
            )}
          >
            <div className="relative -mx-4 sm:mx-0">
              <div className="flex gap-2 overflow-x-auto px-4 pb-2 sm:flex-wrap sm:overflow-visible sm:px-0">
                {categories.map((cat) => {
                  const selected = cat.id === active?.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveId(cat.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                        selected
                          ? "border-primary-500/50 bg-primary-500/15 text-primary-100 shadow-[0_0_24px_-8px_rgba(var(--color-primary-500-rgb),0.5)]"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      {cat.icon ? (
                        <span className="text-base leading-none" aria-hidden>
                          {cat.icon}
                        </span>
                      ) : (
                        <BookOpen className="h-4 w-4 opacity-70" />
                      )}
                      <span>{cat.name}</span>
                      {cat.products && cat.products.length > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                            selected
                              ? "bg-primary-500/30 text-primary-50"
                              : "bg-white/10 text-slate-400",
                          )}
                        >
                          {cat.products.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
              {active && (
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white sm:text-2xl">
                      {active.icon && (
                        <span className="mr-2">{active.icon}</span>
                      )}
                      {active.name}
                    </h3>
                    {active.description && (
                      <p className="mt-2 max-w-2xl text-slate-400">
                        {active.description}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={openProduct}
                    className="shrink-0 bg-primary-600 text-white hover:bg-primary-500"
                  >
                    {isAuthenticated ? "Open dashboard" : "Sign up to access"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {products.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Products for this category will appear here once published by
                  your admin.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={openProduct}
                      className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-primary-500/40 hover:bg-primary-500/5"
                    >
                      <span className="font-medium text-slate-100 group-hover:text-white">
                        {product.name}
                      </span>
                      {product.description && (
                        <span className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {product.description}
                        </span>
                      )}
                      <span className="mt-3 inline-flex items-center text-xs font-medium text-primary-400 opacity-0 transition-opacity group-hover:opacity-100">
                        View in app
                        <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
