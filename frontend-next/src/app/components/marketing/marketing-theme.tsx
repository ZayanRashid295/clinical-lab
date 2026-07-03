"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/shared/utils/cn";

export const MARKETING_THEME_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

  .marketing-surface {
    font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    letter-spacing: -0.011em;
  }

  .marketing-surface.theme-dark {
    --mkt-bg: #020617;
    --mkt-bg-elevated: #0b1220;
    --mkt-bg-muted: #0f172a;
    --mkt-text: #f8fafc;
    --mkt-text-muted: #94a3b8;
    --mkt-text-subtle: #64748b;
    --mkt-border: #283246;
    --mkt-accent: #059669;
    --mkt-accent-hover: #047857;
    --mkt-accent-muted: #10b981;
    --mkt-accent-soft: rgba(5, 150, 105, 0.12);
    --mkt-accent-ring: rgba(5, 150, 105, 0.35);
    --mkt-header-bg: rgba(2, 6, 23, 0.92);
    --mkt-overlay-bg: rgba(2, 6, 23, 0.98);
    --mkt-badge-bg: rgba(16, 185, 129, 0.08);
    --mkt-card-hover: rgba(5, 150, 105, 0.1);
    --mkt-stat-bg: rgba(255, 255, 255, 0.06);
    --mkt-stat-border: rgba(255, 255, 255, 0.1);
    --mkt-footer-text: #c9d4cf;
    --mkt-footer-muted: #9cb8ae;
    --mkt-footer-dim: #7e948c;
    --mkt-shadow: rgba(0, 0, 0, 0.35);
    --mkt-input-bg: rgba(15, 23, 42, 0.8);
    --mkt-hero-gradient-from: #020617;
    --mkt-hero-gradient-via: #0f172a;
    --mkt-glow: rgba(5, 150, 105, 0.2);
  }

  .marketing-surface.theme-light {
    --mkt-bg: #f8fafc;
    --mkt-bg-elevated: #ffffff;
    --mkt-bg-muted: #f1f5f9;
    --mkt-text: #0f172a;
    --mkt-text-muted: #64748b;
    --mkt-text-subtle: #94a3b8;
    --mkt-border: #e2e8f0;
    --mkt-accent: #059669;
    --mkt-accent-hover: #047857;
    --mkt-accent-muted: #10b981;
    --mkt-accent-soft: rgba(5, 150, 105, 0.08);
    --mkt-accent-ring: rgba(5, 150, 105, 0.22);
    --mkt-header-bg: rgba(255, 255, 255, 0.92);
    --mkt-overlay-bg: rgba(255, 255, 255, 0.98);
    --mkt-badge-bg: rgba(5, 150, 105, 0.06);
    --mkt-card-hover: rgba(5, 150, 105, 0.06);
    --mkt-stat-bg: #f8fafc;
    --mkt-stat-border: #e2e8f0;
    --mkt-footer-text: #334155;
    --mkt-footer-muted: #64748b;
    --mkt-footer-dim: #94a3b8;
    --mkt-shadow: rgba(15, 23, 42, 0.08);
    --mkt-input-bg: #ffffff;
    --mkt-hero-gradient-from: #f8fafc;
    --mkt-hero-gradient-via: #ecfdf5;
    --mkt-glow: rgba(5, 150, 105, 0.12);
  }

  .mkt-theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 8px;
    border: 1px solid var(--mkt-border);
    background: transparent;
    color: var(--mkt-text-muted);
    cursor: pointer;
    transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease;
  }

  .mkt-theme-toggle:hover {
    color: var(--mkt-text);
    background: var(--mkt-accent-soft);
    border-color: var(--mkt-accent-muted);
  }

  /* Auth layout */
  .mkt-auth-root {
    background: var(--mkt-bg);
    color: var(--mkt-text);
  }

  .mkt-auth-hero {
    background: linear-gradient(
      135deg,
      var(--mkt-hero-gradient-from) 0%,
      var(--mkt-hero-gradient-via) 50%,
      var(--mkt-hero-gradient-from) 100%
    );
  }

  .mkt-auth-hero-glow {
    background: radial-gradient(
      ellipse 120% 80% at 0% -20%,
      var(--mkt-glow),
      transparent 50%
    );
  }

  .mkt-auth-panel {
    background: var(--mkt-bg-elevated);
    border-color: var(--mkt-border);
  }

  .mkt-auth-label {
    color: var(--mkt-text);
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  .mkt-auth-input {
    height: 3rem;
    border-radius: 0.75rem;
    border: 1px solid var(--mkt-border);
    background: var(--mkt-input-bg);
    color: var(--mkt-text);
    padding: 0 1rem;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .mkt-auth-input::placeholder {
    color: var(--mkt-text-subtle);
  }

  .mkt-auth-input:focus-visible {
    outline: none;
    border-color: var(--mkt-accent-muted);
    box-shadow: 0 0 0 3px var(--mkt-accent-ring);
  }

  .mkt-auth-tab-shell {
    border: 1px solid var(--mkt-border);
    background: var(--mkt-bg-muted);
  }

  .mkt-auth-tab-active {
    background: var(--mkt-bg-elevated);
    color: var(--mkt-text);
    box-shadow: 0 1px 3px var(--mkt-shadow);
    border: 1px solid var(--mkt-border);
  }

  .mkt-auth-tab-idle {
    color: var(--mkt-text-muted);
  }

  .mkt-auth-tab-idle:hover {
    background: var(--mkt-accent-soft);
    color: var(--mkt-text);
  }

  .mkt-auth-eyebrow {
    color: var(--mkt-text-muted);
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
  }

  .mkt-auth-btn-primary {
    height: 3rem;
    width: 100%;
    border-radius: 6px;
    border: none;
    background: var(--mkt-accent);
    color: #fff;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
    box-shadow: none;
  }

  .mkt-auth-btn-primary:hover:not(:disabled) {
    background: var(--mkt-accent-hover);
  }

  .mkt-auth-btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  .mkt-auth-link {
    color: var(--mkt-accent-muted);
    font-weight: 600;
  }

  .mkt-auth-link:hover {
    color: var(--mkt-accent);
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .mkt-auth-badge {
    border: 1px solid var(--mkt-accent-ring);
    background: var(--mkt-accent-soft);
    color: var(--mkt-accent-muted);
  }

  .mkt-auth-trust {
    border: 1px solid var(--mkt-accent-ring);
    background: var(--mkt-accent-soft);
  }

  .mkt-auth-muted {
    color: var(--mkt-text-muted);
  }

  .mkt-auth-icon-shell {
    background: linear-gradient(135deg, var(--mkt-accent-soft), transparent);
    border: 1px solid var(--mkt-border);
    box-shadow: 0 8px 32px var(--mkt-shadow);
  }
`;

export function MarketingThemeShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { config } = useTheme();
  const isDark = config.theme === "dark";

  return (
    <>
      <style>{MARKETING_THEME_CSS}</style>
      <div
        className={cn(
          "marketing-surface min-h-screen w-full",
          isDark ? "theme-dark" : "theme-light",
          className,
        )}
        style={{ background: "var(--mkt-bg)", color: "var(--mkt-text)" }}
      >
        {children}
      </div>
    </>
  );
}

export function MarketingThemeToggle({ className }: { className?: string }) {
  const { config, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = config.theme === "dark";

  return (
    <button
      type="button"
      className={cn("mkt-theme-toggle", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {mounted ? (
        isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />
      ) : (
        <Moon size={18} strokeWidth={1.75} />
      )}
    </button>
  );
}
