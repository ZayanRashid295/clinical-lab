"use client";

import type { ReactNode } from "react";

export type CinematicSectionAlign = "left" | "center";

export function CinematicEditorialLine({
  kicker,
  children,
  nowrap = false,
}: {
  kicker: string;
  children: ReactNode;
  nowrap?: boolean;
}) {
  return (
    <div className="cine-editorial-line">
      <div className="cine-editorial-line-bar" aria-hidden />
      <div className="cine-editorial-line-body">
        <span className="cine-editorial-kicker">{kicker}</span>
        <p
          className={`cine-editorial-statement${nowrap ? " cine-editorial-statement--nowrap" : ""}`}
        >
          {children}
        </p>
      </div>
    </div>
  );
}

export function CinematicSectionHead({
  kicker,
  title,
  lead,
  align = "left",
}: {
  kicker: string;
  title: ReactNode;
  lead?: string;
  align?: CinematicSectionAlign;
}) {
  return (
    <div className={`cine-section-head cine-section-head--${align}`}>
      <span className="cine-section-kicker">
        <span className="cine-section-kicker-dot" aria-hidden />
        {kicker}
      </span>
      <h2 className="cine-section-title lp-h2">{title}</h2>
      {lead ? <p className="cine-section-lead">{lead}</p> : null}
    </div>
  );
}
