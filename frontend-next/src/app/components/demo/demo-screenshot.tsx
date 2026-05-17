"use client";

import { type CSSProperties } from "react";
import { cn } from "@/shared/utils/cn";

/** Native img for pixel-sharp UI screenshots (no Next resize / transform scaling). */
export function DemoScreenshot({
  src,
  alt,
  width,
  height,
  className,
  style,
  framed = true,
  fit = "width",
  maxHeight,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
  framed?: boolean;
  /** width: full width; contain: cap with maxHeight; fill: scale up to fill parent (object-contain) */
  fit?: "width" | "contain" | "fill";
  maxHeight?: string;
}) {
  const imgStyle: CSSProperties | undefined =
    fit === "contain" && maxHeight ? { maxHeight, maxWidth: "100%" } : undefined;

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      decoding="sync"
      loading="eager"
      fetchPriority="high"
      className={cn(
        "demo-screenshot__img block object-contain",
        fit === "fill" && "h-full min-h-0 w-full max-h-full max-w-full",
        fit === "contain" && "mx-auto h-auto w-auto max-h-full max-w-full",
        fit === "width" && "h-auto w-full max-w-full",
      )}
      style={imgStyle}
      draggable={false}
    />
  );

  if (!framed) {
    return (
      <div className={cn("demo-screenshot h-full w-full", className)} style={style}>
        {img}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "demo-screenshot rounded-xl border border-white/10 shadow-2xl ring-1 ring-white/10",
        fit === "fill" && "h-full min-h-0 w-full overflow-hidden",
        fit === "contain" && "flex w-full items-center justify-center overflow-visible",
        fit === "width" && "overflow-hidden",
        className,
      )}
      style={style}
    >
      {img}
    </div>
  );
}
