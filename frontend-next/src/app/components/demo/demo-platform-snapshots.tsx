"use client";

import { type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { anim } from "./demo-primitives";
import { PLATFORM_MODULES } from "./demo-platform-data";

export function PlatformModulesSnapshot({ style }: { style?: CSSProperties }) {
  return (
    <div
      className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:gap-12"
      style={style}
    >
      {PLATFORM_MODULES.map((mod, i) => {
        const Icon = mod.icon;
        return (
          <article
            key={mod.id}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm"
            style={anim("demo-slide-up-deep", 400 + i * 220, "0.75s")}
          >
            <div className={cn("h-1.5 w-full bg-gradient-to-r", mod.accentBar)} />
            <div className="space-y-5 p-6 sm:space-y-6 sm:p-8">
              <div className={cn("inline-flex rounded-xl p-3.5 ring-1", mod.iconWrap)}>
                <Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.75} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400 sm:text-base">
                  {mod.eyebrow}
                </p>
                <h3 className="text-3xl font-bold text-white sm:text-4xl">{mod.name}</h3>
                <p className="text-lg leading-relaxed text-zinc-400 sm:text-xl lg:leading-8">
                  {mod.description}
                </p>
              </div>
              <ul className="space-y-3 sm:space-y-3.5">
                {mod.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 text-base leading-relaxed text-zinc-300 sm:text-lg"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/90" />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="inline-flex items-center gap-2 pt-1 text-base font-semibold text-red-400 sm:text-lg">
                Explore module
                <ArrowRight className="h-4 w-4" />
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
