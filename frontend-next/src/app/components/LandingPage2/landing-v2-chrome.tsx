"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Container, LANDING_V2_CSS } from "./landing-v2-layout";
import { HERO_CINEMATIC_CSS } from "../hero-sequence/hero-cinematic.css";
import { LANDING_CINEMATIC_BODY_CSS } from "../hero-sequence/landing-cinematic-body.css";
import { CINEMATIC_SECTIONS_CSS } from "../hero-sequence/cinematic-sections.css";
import { LANDING_TYPOGRAPHY_CSS } from "../hero-sequence/landing-typography.css";
import { LANDING_SPACING_CSS } from "../hero-sequence/landing-spacing.css";
import { PROGRAM_SHOWCASE_CSS } from "./program-showcase.css";
import { MarketingThemeToggle } from "../marketing/marketing-theme";
import {
  CATEGORIES,
  type ExamProduct,
  type ExamTrack,
} from "./landing-v2-data";

const logoIcon = "/images/landing-v2/logo-icon.png";

/** Hoisted so SSR/client share one string; avoids inline-template drift under HMR. */
const LANDING_V2_CHROME_CSS = `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: auto; }
        html.lenis.lenis-smooth { scroll-behavior: auto !important; }
        body { background: var(--mkt-bg); color: var(--mkt-text); }
        ${LANDING_V2_CSS}
        ${HERO_CINEMATIC_CSS}
        ${LANDING_CINEMATIC_BODY_CSS}
        ${CINEMATIC_SECTIONS_CSS}
        ${LANDING_TYPOGRAPHY_CSS}
        ${LANDING_SPACING_CSS}
        ${PROGRAM_SHOWCASE_CSS}
        .nav-cat-dropdown { position: relative; }
        .nav-cat-menu {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          min-width: 200px;
          padding: 10px 0 0;
          z-index: 220;
        }
        .nav-cat-menu-panel {
          padding: 6px;
          border-radius: 12px;
          border: 1px solid var(--mkt-border);
          background: var(--mkt-overlay-bg, var(--mkt-bg-elevated));
          backdrop-filter: blur(14px);
          box-shadow: 0 18px 40px color-mix(in srgb, #000 16%, transparent);
        }
        .nav-cat-item {
          display: block;
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          border-radius: 8px;
          padding: 10px 12px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--mkt-text);
          transition: background .15s ease;
          white-space: nowrap;
        }
        .nav-cat-item:hover { background: color-mix(in srgb, var(--mkt-accent) 10%, transparent); }
        .cine-category-pick {
          display: block;
          width: 100%;
          text-align: left;
          border: 1px solid var(--mkt-border);
          background: color-mix(in srgb, var(--mkt-bg-elevated) 80%, transparent);
          border-radius: 14px;
          padding: 1.5rem 1.35rem;
          cursor: pointer;
          font-family: inherit;
          color: inherit;
          transition: border-color .2s ease, transform .2s ease, background .2s ease;
        }
        .cine-category-pick:hover {
          border-color: color-mix(in srgb, var(--mkt-accent) 55%, var(--mkt-border));
          background: color-mix(in srgb, var(--mkt-accent) 6%, var(--mkt-bg-elevated));
          transform: translateY(-2px);
        }
        .cine-category-pick .cine-category-kicker {
          display: inline-block;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--mkt-accent);
          font-weight: 600;
          margin-bottom: 0.65rem;
        }
        .cine-category-pick .lp-h3 { margin-bottom: 0.55rem; }
        .cine-category-pick p {
          color: var(--mkt-text-muted);
          line-height: 1.6;
          margin: 0 0 1rem;
          font-size: 1rem;
        }
        .cine-category-cta {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--mkt-accent);
        }
`;

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
  onNavigateToProgram: (program: ExamTrack, product?: ExamProduct) => void;
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
  cinematic,
}: {
  variant?: "primary" | "ghost";
  children: ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  cinematic?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isPrimary = variant === "primary";

  if (cinematic && isPrimary) {
    return (
      <button
        type="button"
        className="landing-cinematic-header-cta"
        onClick={onClick}
        style={{ width: fullWidth ? "100%" : "auto" }}
      >
        {children}
      </button>
    );
  }

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
  chevron: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="6 9 12 15 18 9" />
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

function CategoryNavDropdown({
  category,
  active,
  onSelectProduct,
}: {
  category: ExamTrack;
  active?: boolean;
  onSelectProduct: (product: ExamProduct) => void;
}) {
  const cfg = CATEGORIES[category];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 220);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      ref={rootRef}
      className="nav-cat-dropdown"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={active ? "nav-link-active" : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => {
          clearCloseTimer();
          setOpen((v) => !v);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: "1rem",
          fontWeight: active ? 600 : 400,
          color: active || open ? T.ink : T.slate,
          padding: "4px 0",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          transition: "color .15s",
        }}
      >
        {cfg.navLabel}
        <span style={{ display: "inline-flex", opacity: 0.7, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
          {Icon.chevron}
        </span>
      </button>
      {open ? (
        <div id={menuId} role="menu" className="nav-cat-menu">
          <div className="nav-cat-menu-panel">
            {cfg.products.map((product) => (
              <button
                key={product.slug}
                type="button"
                role="menuitem"
                className="nav-cat-item"
                onClick={() => {
                  clearCloseTimer();
                  setOpen(false);
                  onSelectProduct(product.slug);
                }}
              >
                {product.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileCategoryBlock({
  category,
  active,
  onSelectProduct,
}: {
  category: ExamTrack;
  active?: boolean;
  onSelectProduct: (product: ExamProduct) => void;
}) {
  const cfg = CATEGORIES[category];
  const [open, setOpen] = useState(active ?? false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: "1rem",
          fontWeight: active ? 600 : 400,
          color: active ? T.ink : T.slate,
          padding: 0,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
        }}
      >
        {cfg.navLabel}
        <span style={{ opacity: 0.7, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
          {Icon.chevron}
        </span>
      </button>
      {open ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10, paddingLeft: 4 }}>
          {cfg.products.map((product) => (
            <button
              key={product.slug}
              type="button"
              onClick={() => onSelectProduct(product.slug)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.9375rem",
                color: T.ink,
                padding: "6px 0",
                textAlign: "left",
              }}
            >
              {product.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LandingV2Chrome({
  activePage,
  actions,
  children,
  cinematicNav = false,
  hideFooter = false,
  footerBlurb = "Smart exam preparation for learners who want clarity — not cramming. Every option explained. Built for serious study.",
  footerBottomNote = "Built for learners who refuse to guess · Pakistan",
}: {
  activePage: LandingV2Page;
  actions: LandingV2ChromeActions;
  children: ReactNode;
  /** Dark transparent nav over cinematic hero */
  cinematicNav?: boolean;
  /** Hide site footer (e.g. full-viewport sample / practice pages). */
  hideFooter?: boolean;
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

  const goProduct = (track: ExamTrack, product: ExamProduct = "medicine-and-allied") => {
    closeMobile();
    actions.onNavigateToProgram(track, product);
  };

  const homeHref = activePage === "home" ? "#home" : "/landing-page#home";
  const howHref = "#how-it-works";
  const faqHref = "#faq";

  return (
    <div
      className={cinematicNav ? "landing-cinematic" : undefined}
      style={
        hideFooter
          ? { minHeight: "100dvh", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }
          : undefined
      }
    >
      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: LANDING_V2_CHROME_CSS }}
      />

      <header
        className={cinematicNav ? "landing-cinematic-header" : undefined}
        style={{
          position: "sticky",
          top: 0,
          zIndex: cinematicNav ? 200 : 100,
          ...(cinematicNav
            ? {}
            : {
                background: "var(--mkt-header-bg)",
                backdropFilter: "blur(10px)",
                borderBottom: `1px solid ${T.line}`,
              }),
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
            <CategoryNavDropdown
              category="fcps"
              active={activePage === "fcps"}
              onSelectProduct={(product) => goProduct("fcps", product)}
            />
            <CategoryNavDropdown
              category="jcat"
              active={activePage === "jcat"}
              onSelectProduct={(product) => goProduct("jcat", product)}
            />
            <NavLink href={howHref}>How It Works</NavLink>
            <NavLink href={faqHref}>FAQ</NavLink>
          </div>

          <div className="nav-desktop" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <MarketingThemeToggle />
            <ChromeBtn variant="primary" cinematic={cinematicNav} onClick={actions.onLogin}>
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
                <MobileCategoryBlock
                  category="fcps"
                  active={activePage === "fcps"}
                  onSelectProduct={(product) => goProduct("fcps", product)}
                />
                <MobileCategoryBlock
                  category="jcat"
                  active={activePage === "jcat"}
                  onSelectProduct={(product) => goProduct("jcat", product)}
                />
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
                    cinematic={cinematicNav}
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

      {hideFooter ? (
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{children}</div>
      ) : (
        children
      )}

      {!hideFooter && (
      <footer
        className="lp-footer"
        style={{ background: "var(--mkt-bg)", color: "var(--mkt-footer-text)", borderTop: `1px solid ${T.line}` }}
      >
        <Container>
          <div className="footer-grid lp-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr" }}>
            <div>
              <div className="lp-footer-brand" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, color: "var(--mkt-text)", fontSize: "1.0625rem" }}>
                <LogoBadge size={28} />
                MedPrepAI
              </div>
              <p style={{ fontSize: "1rem", maxWidth: 360, color: "var(--mkt-footer-muted)", lineHeight: 1.65 }}>
                {footerBlurb}
              </p>
            </div>
            <div>
              <h4 className="lp-h4-ui">Programs</h4>
              <ul className="lp-footer-list" style={{ listStyle: "none" }}>
                {(Object.keys(CATEGORIES) as ExamTrack[]).flatMap((id) =>
                  CATEGORIES[id].products.map((product) => (
                    <li key={`${id}-${product.slug}`} style={{ fontSize: "1rem" }}>
                      <button
                        type="button"
                        onClick={() => actions.onNavigateToProgram(id, product.slug)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--mkt-footer-text)",
                          fontFamily: "inherit",
                          fontSize: "1rem",
                          padding: 0,
                          textAlign: "left",
                        }}
                      >
                        {CATEGORIES[id].label} · {product.label}
                      </button>
                    </li>
                  )),
                )}
              </ul>
            </div>
            <div>
              <h4 className="lp-h4-ui">Account</h4>
              <ul className="lp-footer-list" style={{ listStyle: "none" }}>
                <li style={{ fontSize: "1rem" }}>
                  <button
                    type="button"
                    onClick={actions.onLogin}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mkt-footer-text)", fontFamily: "inherit", fontSize: "1rem", padding: 0 }}
                  >
                    Sign in
                  </button>
                </li>
                <li style={{ fontSize: "1rem" }}>
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
      )}
    </div>
  );
}
