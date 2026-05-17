"use client";

import Image from "next/image";
import { Button } from "@/shared/ui/button";
import { ArrowRight, Play } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/shared/utils/cn";

export interface HeroSlide {
  title: string;
  subtitle: string;
  image: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

interface LandingHeroProps {
  slides: HeroSlide[];
  isAuthenticated: boolean;
  onPrimaryClick: () => void;
  onDemoClick: () => void;
  onExploreClick: () => void;
}

export function LandingHero({
  slides,
  isAuthenticated,
  onPrimaryClick,
  onDemoClick,
  onExploreClick,
}: LandingHeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
  const [index, setIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const t = setInterval(() => emblaApi.scrollNext(), 7000);
    return () => clearInterval(t);
  }, [emblaApi]);

  const slide = slides[index] ?? slides[0];

  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-slate-950">
      <div className="absolute inset-0 min-h-[88vh]" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((s, i) => (
            <div key={i} className="relative min-w-0 flex-[0_0_100%]">
              <Image
                src={s.image}
                alt=""
                fill
                className="object-cover"
                priority={i === 0}
                unoptimized
              />
              <div className="absolute inset-0 bg-slate-950/70" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/50" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[calc(88vh-4rem)] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24 lg:px-8">
        <p className="inline-flex items-center rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-300">
          AI clinical education platform
        </p>
        <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
          {slide?.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300 sm:text-xl">
          {slide?.subtitle}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="bg-primary-600 px-8 text-white hover:bg-primary-500"
            onClick={onPrimaryClick}
          >
            {isAuthenticated ? "Go to dashboard" : slide?.ctaPrimary ?? "Get started"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/10"
            onClick={onDemoClick}
          >
            <Play className="mr-2 h-5 w-5" />
            {slide?.ctaSecondary ?? "Watch demo"}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={onExploreClick}
          >
            Explore features
          </Button>
        </div>

        <div className="mt-10 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-8 bg-primary-500" : "w-4 bg-white/30",
              )}
              aria-label={`Hero slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
