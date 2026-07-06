"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Container, LANDING_V2_CSS } from "./landing-v2-layout";
import { MarketingThemeToggle } from "../marketing/marketing-theme";
import type { ExamTrack } from "./landing-v2-data";

const logoIcon = "/images/landing-v2/logo-icon.png";

const T = {
  ink: "var(--mkt-text)",
  slate: "var(--mkt-text-muted)",
  line: "var(--mkt-border)",
  teal: "var(--mkt-accent)",
  tealDeep: "var(--mkt-accent-hover)",
};

export type LandingV2Page = "home" | ExamTrack;

export interface LandingV2ChromeActions {
  onLogin: () => void;
  primaryCtaLabel: string;
  isAuthenticated: boolean;
  onNavigateToProgram: (program: ExamTrack) => void;
}

function LogoBadge({ size = 34 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: "var(--mkt-accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <img src={logoIcon} alt="MedPrepAI" style={{ width: "62%", height: "62%", objectFit: "contain" }} />
    </div>
  );
}

function ChromeBtn({
  variant = "primary",
  children,
  onClick,
  fullWidth,
}: {
  variant?: "primary" | "ghost";
  children: ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 6,
        fontWeight: 500,
        cursor: "pointer",
        border: isPrimary ? "none" : `1px solid ${hovered ? T.teal : T.line}`,
        background: isPrimary ? (hovered ? T.tealDeep : T.teal) : "transparent",
        color: isPrimary ? "#fff" : T.ink,
        padding: "10px 20px",
        fontSize: "0.9375rem",
        fontFamily: "inherit",
        width: fullWidth ? "100%" : "auto",
        transition: "background .15s ease, border-color .15s ease",
      }}
    >
      {children}
    </button>
  );
}

const Icon = {
  menu: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

function NavLink({
  href,
  children,
  onClick,
  active,
}: {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      onClick={onClick}
      className={active ? "nav-link-active" : undefined}
      style={{
        color: active || hov ? T.ink : T.slate,
        textDecoration: "none",
        fontSize: "1rem",
        fontWeight: active ? 600 : 400,
        transition: "color .15s",
        cursor: "pointer",
        padding: "4px 0",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </a>
  );
}

function NavButton({
  children,
  onClick,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "nav-link-active" : undefined}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "1rem",
        fontWeight: active ? 600 : 400,
        color: active || hov ? T.ink : T.slate,
        padding: 0,
        textAlign: "left",
        transition: "color .15s",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
}

export function LandingV2Chrome({
  activePage,
  actions,
  children,
  footerBlurb = "Smart exam preparation for learners who want clarity — not cramming. Every option explained. Built for serious study.",
  footerBottomNote = "Built for learners who refuse to guess · Pakistan",
}: {
  activePage: LandingV2Page;
  actions: LandingV2ChromeActions;
  children: ReactNode;
  /** Home page uses generic copy; program pages override with track-specific text. */
  footerBlurb?: string;
  footerBottomNote?: string;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobile = () => setMobileMenuOpen(false);

  const goHome = () => {
    closeMobile();
    void router.push("/landing-page");
  };

  const goProgram = (track: ExamTrack) => {
    closeMobile();
    actions.onNavigateToProgram(track);
  };

  const homeHref = activePage === "home" ? "#home" : "/landing-page#home";
  const howHref = "#how-it-works";
  const faqHref = "#faq";

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--mkt-bg); color: var(--mkt-text); }
        ${LANDING_V2_CSS}
      `}</style>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--mkt-header-bg)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <Container style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 18, paddingBottom: 18 }}>
          <Link
            href="/landing-page"
            onClick={closeMobile}
            style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: "1.0625rem", color: T.ink, textDecoration: "none" }}
          >
            <LogoBadge size={32} /> MedPrepAI
          </Link>

          <div className="nav-desktop" style={{ display: "flex", gap: 28, fontSize: "1rem", alignItems: "center" }}>
            <NavLink href={homeHref} active={activePage === "home"} onClick={activePage === "home" ? closeMobile : undefined}>
              Home
            </NavLink>
            <NavButton onClick={() => goProgram("fcps")} active={activePage === "fcps"}>
              FCPS-1
            </NavButton>
            <NavButton onClick={() => goProgram("jcat")} active={activePage === "jcat"}>
              JCAT (MDMS)
            </NavButton>
            <NavLink href={howHref}>How It Works</NavLink>
            <NavLink href={faqHref}>FAQ</NavLink>
          </div>

          <div className="nav-desktop" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <MarketingThemeToggle />
            <ChromeBtn variant="primary" onClick={actions.onLogin}>
              {actions.primaryCtaLabel}
            </ChromeBtn>
          </div>

          <button
            type="button"
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.ink, display: "none", padding: "4px" }}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? Icon.close : Icon.menu}
          </button>
        </Container>

        {mobileMenuOpen && (
          <div
            className="mobile-menu-overlay"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "var(--mkt-overlay-bg)",
              backdropFilter: "blur(10px)",
              borderBottom: `1px solid ${T.line}`,
              padding: "20px 0",
              display: "block",
            }}
          >
            <Container>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <NavLink href={homeHref} active={activePage === "home"} onClick={goHome}>
                  Home
                </NavLink>
                <NavButton onClick={() => goProgram("fcps")} active={activePage === "fcps"}>
                  FCPS-1
                </NavButton>
                <NavButton onClick={() => goProgram("jcat")} active={activePage === "jcat"}>
                  JCAT (MDMS)
                </NavButton>
                <NavLink href={howHref} onClick={closeMobile}>
                  How It Works
                </NavLink>
                <NavLink href={faqHref} onClick={closeMobile}>
                  FAQ
                </NavLink>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <MarketingThemeToggle />
                  </div>
                  <ChromeBtn
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      actions.onLogin();
                      closeMobile();
                    }}
                  >
                    {actions.primaryCtaLabel}
                  </ChromeBtn>
                </div>
              </div>
            </Container>
          </div>
        )}
      </header>

      {children}

      <footer style={{ background: "var(--mkt-bg)", color: "var(--mkt-footer-text)", padding: "64px 0 32px", borderTop: `1px solid ${T.line}` }}>
        <Container>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, color: "var(--mkt-text)", fontSize: "1.0625rem", marginBottom: 14 }}>
                <LogoBadge size={28} />
                MedPrepAI
              </div>
              <p style={{ fontSize: "1rem", maxWidth: 360, color: "var(--mkt-footer-muted)", lineHeight: 1.65 }}>
                {footerBlurb}
              </p>
            </div>
            <div>
              <h4 style={{ color: "var(--mkt-text)", fontSize: "1rem", marginBottom: 12, fontWeight: 600 }}>Programs</h4>
              <ul style={{ listStyle: "none" }}>
                {(
                  [
                    ["FCPS-1", "fcps"],
                    ["JCAT (MDMS)", "jcat"],
                  ] as Array<[string, ExamTrack]>
                ).map(([label, id]) => (
                  <li key={label} style={{ marginBottom: 10, fontSize: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => actions.onNavigateToProgram(id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mkt-footer-text)", fontFamily: "inherit", fontSize: "1rem", padding: 0, textAlign: "left" }}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ color: "var(--mkt-text)", fontSize: "1rem", marginBottom: 12, fontWeight: 600 }}>Account</h4>
              <ul style={{ listStyle: "none" }}>
                <li style={{ marginBottom: 10, fontSize: "1rem" }}>
                  <button
                    type="button"
                    onClick={actions.onLogin}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mkt-footer-text)", fontFamily: "inherit", fontSize: "1rem", padding: 0 }}
                  >
                    Sign in
                  </button>
                </li>
                <li style={{ marginBottom: 10, fontSize: "1rem" }}>
                  <a href={faqHref} style={{ color: "var(--mkt-footer-text)", textDecoration: "none" }}>
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid var(--mkt-border)",
              paddingTop: 24,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              fontSize: "0.875rem",
              color: "var(--mkt-footer-dim)",
            }}
          >
            <span>© 2026 MedPrepAI. All rights reserved.</span>
            <span>{footerBottomNote}</span>
          </div>
        </Container>
      </footer>
    </>
  );
}
