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
    /* --mkt-* tokens are set on :root by ThemeService (shared with the app shell) */
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

  /* Auth — centered card layout aligned with Landing Page 2 */
  .mkt-auth-page {
    font-family: "Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 16px;
    letter-spacing: -0.011em;
    -webkit-font-smoothing: antialiased;
  }

  .mkt-auth-shell {
    background: var(--mkt-bg);
    color: var(--mkt-text);
  }

  .mkt-auth-shell-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.25rem;
    max-width: 72rem;
    margin: 0 auto;
    width: 100%;
  }

  .mkt-auth-shell-back {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--mkt-text-muted);
    text-decoration: none;
    padding: 0.35rem 0.5rem;
    margin-left: -0.5rem;
    border-radius: 6px;
    transition: color 0.15s ease, background 0.15s ease;
  }

  .mkt-auth-shell-back:hover {
    color: var(--mkt-text);
    background: var(--mkt-accent-soft);
  }

  .mkt-auth-shell-back svg {
    width: 1rem;
    height: 1rem;
  }

  .mkt-auth-shell-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .mkt-auth-layout {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 1.25rem 2.5rem;
    min-height: calc(100dvh - 3.25rem);
  }

  .mkt-auth-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% -10%, var(--mkt-glow), transparent 55%),
      linear-gradient(180deg, var(--mkt-bg) 0%, var(--mkt-bg-muted) 100%);
    pointer-events: none;
  }

  .mkt-auth-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 26rem;
    padding: 1.75rem 1.5rem 1.5rem;
    background: var(--mkt-bg-elevated);
    border: 1px solid var(--mkt-border);
    border-radius: 12px;
    box-shadow: 0 4px 24px var(--mkt-shadow);
  }

  .mkt-auth-card--signup {
    max-width: 28rem;
  }

  .mkt-auth-card-header {
    text-align: center;
    margin-bottom: 1.25rem;
  }

  .mkt-auth-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    margin-bottom: 1.25rem;
  }

  .mkt-auth-brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 7px;
    background: var(--mkt-accent);
    flex-shrink: 0;
  }

  .mkt-auth-brand-mark img {
    width: 1.125rem;
    height: 1.125rem;
    object-fit: contain;
  }

  .mkt-auth-brand-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--mkt-text);
    letter-spacing: -0.02em;
  }

  .mkt-auth-card-title {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.03em;
    margin: 0 0 0.5rem;
    color: var(--mkt-text);
  }

  .mkt-auth-card-lead {
    font-size: 0.9375rem;
    line-height: 1.55;
    color: var(--mkt-text-muted);
    margin: 0;
    max-width: 22rem;
    margin-left: auto;
    margin-right: auto;
  }

  .mkt-auth-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--mkt-border);
    margin-bottom: 1.25rem;
  }

  .mkt-auth-tab {
    flex: 1;
    padding: 0.625rem 0.5rem;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: transparent;
    color: var(--mkt-text-muted);
    font-size: 0.875rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  .mkt-auth-tab:hover {
    color: var(--mkt-text);
  }

  .mkt-auth-tab--active {
    color: var(--mkt-accent);
    border-bottom-color: var(--mkt-accent);
  }

  .mkt-auth-alert {
    margin-bottom: 1rem;
    padding: 0.65rem 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.08);
    color: #b91c1c;
    font-size: 0.8125rem;
    line-height: 1.45;
    font-weight: 500;
  }

  .dark .mkt-auth-alert {
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.12);
  }

  .mkt-auth-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .mkt-auth-name-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .mkt-auth-form-stack {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .mkt-auth-label {
    color: var(--mkt-text);
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  .mkt-auth-label-optional {
    font-weight: 400;
    color: var(--mkt-text-subtle);
  }

  .mkt-auth-hint {
    font-size: 0.75rem;
    line-height: 1.45;
    color: var(--mkt-text-subtle);
    margin: 0.15rem 0 0;
  }

  .mkt-auth-page .mkt-auth-input,
  .mkt-auth-page input.mkt-auth-input,
  .mkt-auth-page [data-slot="input"].mkt-auth-input {
    height: 2.5rem !important;
    min-height: 2.5rem !important;
    max-height: 2.5rem !important;
    border-radius: 8px;
    border: 1px solid var(--mkt-border);
    background: var(--mkt-input-bg);
    color: var(--mkt-text);
    padding: 0 0.75rem !important;
    font-size: 0.9375rem !important;
    line-height: 1.4;
    box-shadow: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .mkt-auth-page .mkt-auth-input-toggle {
    position: absolute;
    right: 0.25rem;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--mkt-text-muted);
    cursor: pointer;
  }

  .mkt-auth-page .mkt-auth-input-toggle:hover:not(:disabled) {
    background: var(--mkt-accent-soft);
    color: var(--mkt-text);
  }

  .mkt-auth-page .mkt-auth-input-toggle svg {
    width: 1rem;
    height: 1rem;
  }

  .mkt-auth-input::placeholder {
    color: var(--mkt-text-subtle);
  }

  .mkt-auth-input:focus-visible {
    outline: none;
    border-color: var(--mkt-accent-muted);
    box-shadow: 0 0 0 3px var(--mkt-accent-ring);
  }

  .mkt-auth-btn-primary {
    height: 2.625rem;
    width: 100%;
    margin-top: 0.25rem;
    border-radius: 8px;
    border: none;
    background: var(--mkt-accent);
    color: #fff;
    font-size: 0.9375rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s ease;
    box-shadow: none;
  }

  .mkt-auth-btn-primary:hover:not(:disabled) {
    background: var(--mkt-accent-hover);
  }

  .mkt-auth-btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .mkt-auth-btn-secondary {
    height: 2.25rem;
    width: 100%;
    border-radius: 8px;
    border: 1px dashed var(--mkt-border);
    background: var(--mkt-bg-muted);
    color: var(--mkt-text-muted);
    font-size: 0.8125rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .mkt-auth-btn-secondary:hover:not(:disabled) {
    background: var(--mkt-accent-soft);
    color: var(--mkt-text);
  }

  .mkt-auth-btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .mkt-auth-switch {
    margin: 1.25rem 0 0;
    text-align: center;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--mkt-text-muted);
  }

  .mkt-auth-link {
    color: var(--mkt-accent);
    font-weight: 600;
    font-size: inherit;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
  }

  .mkt-auth-link:hover {
    color: var(--mkt-accent-hover);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .mkt-auth-dev {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--mkt-border);
  }

  .mkt-auth-fine-print {
    margin: 1.25rem 0 0;
    padding-top: 1rem;
    border-top: 1px solid var(--mkt-border);
    text-align: center;
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--mkt-text-subtle);
  }

  .mkt-auth-muted {
    color: var(--mkt-text-muted);
  }

  .mkt-auth-loading {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .mkt-auth-loading p {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--mkt-text-muted);
    margin: 0;
  }

  .mkt-auth-loading-spinner {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 2px solid var(--mkt-accent-ring);
    border-top-color: var(--mkt-accent);
    animation: mkt-auth-spin 0.7s linear infinite;
  }

  @keyframes mkt-auth-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .mkt-auth-card {
      padding: 1.5rem 1.125rem 1.25rem;
      border-radius: 10px;
    }

    .mkt-auth-name-row {
      grid-template-columns: 1fr;
    }

    .mkt-auth-card-title {
      font-size: 1.375rem;
    }
  }
`;

export function MarketingThemeShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <style>{MARKETING_THEME_CSS}</style>
      <div
        className={cn("marketing-surface min-h-screen w-full", className)}
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
