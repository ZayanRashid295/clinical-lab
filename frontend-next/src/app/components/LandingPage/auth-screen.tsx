"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import {
  Stethoscope,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { authService } from "@/shared/services/auth.service";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";
import { useRouter } from "next/router";
import { routeAfterLogin } from "@/lib/auth/post-login-route";

export type AuthModalView = "login" | "signup";

const isDev = process.env.NODE_ENV === "development";

export const PASSWORD_HINT =
  "Use at least 8 characters with at least one letter and one number.";

export function passwordMeetsPolicy(p: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(p);
}

export interface AuthScreenProps {
  initialView: AuthModalView;
  pendingPackageId?: string | null;
  /** Keep the URL in sync when switching tabs (e.g. shallow `router.replace`). */
  onNavigateMode?: (view: AuthModalView) => void;
}

export function AuthScreen({
  initialView,
  pendingPackageId,
  onNavigateMode,
}: AuthScreenProps) {
  const router = useRouter();
  const [view, setView] = useState<AuthModalView>(initialView);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const goToView = (v: AuthModalView) => {
    setView(v);
    setError("");
    onNavigateMode?.(v);
  };

  const afterAuthSuccess = () => {
    if (pendingPackageId) {
      router.replace(`/checkout-basic?packageId=${encodeURIComponent(pendingPackageId)}`);
      return;
    }
    const user = authService.getCurrentUser() as { roles?: string[] } | null;
    router.replace(routeAfterLogin(user?.roles));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authService.login(email, password);
      if (pendingPackageId) {
        router.replace(`/checkout-basic?packageId=${encodeURIComponent(pendingPackageId)}`);
        return;
      }
      const roles = (result?.user as { roles?: string[] })?.roles;
      router.replace(routeAfterLogin(roles));
    } catch (err) {
      setError(getApiErrorMessage(err, "Sign-in failed. Check your details and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!passwordMeetsPolicy(password)) {
      setError(PASSWORD_HINT);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.registerAndSignIn({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      afterAuthSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create your account. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail("admin@clinicallab.test");
    setPassword("password123");
    setError("");
  };

  const isSignup = view === "signup";

  const inputClass = "mkt-auth-input w-full shadow-sm disabled:opacity-50";

  const heroBullets = isSignup
    ? [
        "Learner profile in minutes — no paperwork",
        "Cases, trials, and dashboard in one place",
        "Industry-standard encryption for your data",
      ]
    : [
        "Pick up simulations and assessments where you left off",
        "Progress stays synced to your secure profile",
        "Built for individual learners and institutions",
      ];

  return (
    <div className="mkt-auth-root flex min-h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden lg:flex-row">
      {/* Hero — full width on mobile, half viewport on large screens */}
      <section className="relative flex min-h-[min(52vh,480px)] flex-1 flex-col items-center justify-center px-8 py-16 sm:px-12 sm:py-20 lg:min-h-0 lg:flex-[1.08] lg:items-center lg:justify-center lg:px-20 lg:py-24 xl:px-24 xl:py-28">
        <div className="mkt-auth-hero absolute inset-0" aria-hidden />
        <div className="mkt-auth-hero-glow absolute inset-0" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.06'%3E%3Cpath d='M36 38v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 38v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />

        <div className="relative z-[1] flex w-full max-w-xl flex-col items-center justify-center gap-10 py-4 text-center sm:gap-12 lg:max-w-xl lg:gap-16 lg:py-10">
          <div
            className={cn(
              "mkt-auth-icon-shell flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl sm:h-24 sm:w-24",
            )}
          >
            {isSignup ? (
              <UserPlus className="h-10 w-10 sm:h-11 sm:w-11" strokeWidth={1.5} aria-hidden style={{ color: "var(--mkt-text)" }} />
            ) : (
              <Stethoscope className="h-10 w-10 sm:h-11 sm:w-11" strokeWidth={1.5} aria-hidden style={{ color: "var(--mkt-text)" }} />
            )}
          </div>

          <div className="flex flex-col items-center gap-6 sm:gap-8">
            <div className="mkt-auth-badge inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5" aria-hidden style={{ color: "var(--mkt-accent-muted)" }} />
              Clinical exam preparation
            </div>
            <h1
              className="max-w-lg text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:leading-tight"
              style={{ color: "var(--mkt-text)" }}
            >
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="max-w-lg text-pretty text-base leading-relaxed sm:text-lg sm:leading-relaxed mkt-auth-muted">
              {isSignup
                ? "Practice clinical skills with AI in a secure, structured environment — built for serious medical learners."
                : "Sign in to continue simulations, assessments, and your personalized learning path."}
            </p>
          </div>

          <ul className="flex w-full max-w-lg flex-col items-center gap-5 sm:gap-6">
            {heroBullets.map((line) => (
              <li
                key={line}
                className="flex w-full max-w-md items-start justify-center gap-4 text-left text-sm leading-relaxed sm:text-base mkt-auth-muted"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 sm:h-6 sm:w-6"
                  strokeWidth={2}
                  aria-hidden
                  style={{ color: "var(--mkt-accent-muted)" }}
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Form — full width below hero on mobile, half viewport on large screens */}
      <section
        className={cn(
          "mkt-auth-panel relative z-[2] flex flex-1 flex-col justify-center overflow-y-auto border-t",
          "px-6 py-12 sm:px-10 sm:py-16 lg:min-h-0 lg:border-l lg:border-t-0 lg:px-14 lg:py-20 xl:px-20 xl:py-24",
        )}
      >
        <div className="mx-auto w-full max-w-md lg:max-w-lg">
        <p className="mkt-auth-eyebrow mb-5 text-center lg:text-left">
          {isSignup ? "Registration" : "Sign in"}
        </p>
        <div
          className="mkt-auth-tab-shell mb-8 flex rounded-2xl p-1.5 shadow-inner"
          role="tablist"
          aria-label="Sign in or create account"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isSignup}
            className={cn(
              "flex-1 cursor-pointer rounded-xl py-3 text-sm font-semibold transition-all duration-200",
              !isSignup ? "mkt-auth-tab-active" : "mkt-auth-tab-idle",
            )}
            onClick={() => goToView("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignup}
            className={cn(
              "flex-1 cursor-pointer rounded-xl py-3 text-sm font-semibold transition-all duration-200",
              isSignup ? "mkt-auth-tab-active" : "mkt-auth-tab-idle",
            )}
            onClick={() => goToView("signup")}
          >
            Create account
          </button>
        </div>

        {isSignup ? (
          <form onSubmit={handleSignupSubmit} className="space-y-5">
            {error && (
              <Alert
                variant="destructive"
                className="rounded-2xl border-red-500/40 bg-red-500/15 text-red-100"
              >
                <AlertDescription className="text-sm font-medium leading-snug">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="auth-first-name" className="mkt-auth-label">
                  First name
                </Label>
                <Input
                  id="auth-first-name"
                  name="given-name"
                  autoComplete="given-name"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-last-name" className="mkt-auth-label">
                  Last name
                </Label>
                <Input
                  id="auth-last-name"
                  name="family-name"
                  autoComplete="family-name"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-signup-email" className="mkt-auth-label">
                Work or school email
              </Label>
              <Input
                id="auth-signup-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@hospital.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-phone" className="mkt-auth-label">
                Phone{" "}
                <span className="font-normal mkt-auth-muted">(optional)</span>
              </Label>
              <Input
                id="auth-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-signup-password" className="mkt-auth-label">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="auth-signup-password"
                  name="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={cn(inputClass, "pr-12")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg mkt-auth-muted hover:bg-[var(--mkt-accent-soft)]"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs leading-relaxed mkt-auth-muted">{PASSWORD_HINT}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-confirm-password" className="mkt-auth-label">
                Confirm password
              </Label>
              <Input
                id="auth-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mkt-auth-btn-primary mt-2 inline-flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-accent-ring)]"
            >
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="rounded-2xl border-red-500/40 bg-red-500/15 text-red-100"
              >
                <AlertDescription className="text-sm font-medium leading-snug">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-email" className="mkt-auth-label">
                Email
              </Label>
              <Input
                id="auth-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@hospital.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-password" className="mkt-auth-label">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={cn(inputClass, "pr-12")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg mkt-auth-muted hover:bg-[var(--mkt-accent-soft)]"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mkt-auth-btn-primary mt-2 inline-flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-accent-ring)]"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        <div className="mkt-auth-trust mt-8 flex gap-3.5 rounded-2xl px-4 py-4">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--mkt-accent-soft)" }}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden style={{ color: "var(--mkt-accent-muted)" }} />
          </div>
          <p className="text-sm leading-relaxed mkt-auth-muted">
            {isSignup
              ? "By continuing, you agree to use MedPrepAI responsibly. We protect your data with encryption in transit and at rest."
              : "Use a strong password and a device you trust. Never share your credentials with anyone."}
          </p>
        </div>

        {isDev && !isSignup && (
          <div className="mt-8 border-t pt-8" style={{ borderColor: "var(--mkt-border)" }}>
            <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.15em] mkt-auth-muted">
              Local development
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillTestCredentials}
              disabled={isLoading}
              className="w-full cursor-pointer rounded-xl border border-dashed mkt-auth-muted hover:bg-[var(--mkt-accent-soft)]"
              style={{ borderColor: "var(--mkt-border)", background: "var(--mkt-bg-muted)" }}
            >
              Fill demo credentials
            </Button>
          </div>
        )}

        {isSignup ? (
          <p className="mt-8 text-center text-sm leading-relaxed mkt-auth-muted lg:text-left">
            Already have an account?{" "}
            <button
              type="button"
              className="mkt-auth-link"
              onClick={() => goToView("login")}
            >
              Sign in
            </button>
          </p>
        ) : (
          <div className="mt-8 space-y-2 text-center lg:text-left">
            <p className="text-sm leading-relaxed mkt-auth-muted">
              New to MedPrepAI?{" "}
              <button
                type="button"
                className="mkt-auth-link"
                onClick={() => goToView("signup")}
              >
                Create an account
              </button>
            </p>
            <p className="text-xs leading-relaxed mkt-auth-muted">
              Institutional access is managed by your administrator.
            </p>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
