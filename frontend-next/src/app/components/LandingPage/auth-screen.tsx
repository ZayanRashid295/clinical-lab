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
import { useRouter } from "next/router";

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
    } else {
      router.replace("/");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authService.login(email, password);
      afterAuthSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign-in failed. Check your details and try again.";
      setError(errorMessage);
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
      const errorMessage =
        err instanceof Error ? err.message : "Could not create your account. Please try again.";
      setError(errorMessage);
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

  const fieldLabel =
    "text-sm font-medium text-foreground/80 tracking-tight";

  const inputClass =
    "h-12 rounded-xl border-border/60 bg-background px-4 shadow-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground/55 focus-visible:border-teal-600/50 focus-visible:ring-2 focus-visible:ring-teal-600/15 dark:focus-visible:border-teal-500/40 dark:focus-visible:ring-teal-500/10";

  const primaryBtn =
    "h-12 w-full rounded-xl text-[15px] font-semibold text-white shadow-lg shadow-teal-900/20 transition-all duration-200 bg-gradient-to-r from-teal-600 via-teal-600 to-emerald-700 hover:from-teal-500 hover:via-teal-600 hover:to-emerald-600 hover:shadow-xl hover:shadow-teal-900/25 active:scale-[0.995] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none dark:from-teal-500 dark:via-teal-600 dark:to-emerald-700 dark:shadow-teal-950/40";

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
    <div className="flex min-h-[calc(100dvh-3.5rem)] w-full flex-col overflow-hidden lg:flex-row">
      {/* Hero — full width on mobile, half viewport on large screens */}
      <section className="relative flex min-h-[min(44vh,400px)] flex-1 flex-col items-center justify-center px-8 py-12 sm:px-12 sm:py-16 lg:min-h-0 lg:flex-[1.08] lg:items-start lg:justify-center lg:px-16 lg:py-20 xl:px-20">
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 dark:from-slate-950 dark:via-teal-950/90 dark:to-indigo-950"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_0%_-20%,rgba(45,212,191,0.22),transparent_50%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_100%,rgba(99,102,241,0.18),transparent_45%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 38v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 38v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent lg:from-slate-950/40" aria-hidden />

        <div className="relative z-[1] w-full max-w-xl text-center lg:max-w-lg lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-1.5 text-xs font-medium tracking-wide text-teal-100/95 shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-teal-300" aria-hidden />
            Clinical Lab
          </div>
          <h1 className="text-balance font-semibold tracking-tight text-white text-3xl sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-slate-300 sm:text-[17px] lg:mx-0 lg:max-w-none">
            {isSignup
              ? "Practice clinical skills with AI in a secure, structured environment — built for serious medical learners."
              : "Sign in to continue simulations, assessments, and your personalized learning path."}
          </p>

          <ul className="mx-auto mt-8 max-w-md space-y-3 text-left text-sm leading-snug text-slate-300/95 sm:text-[15px] lg:mx-0 lg:max-w-none">
            {heroBullets.map((line) => (
              <li key={line} className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-teal-400/90"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="relative z-[1] mt-10 flex justify-center lg:mt-12 lg:justify-start">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl sm:h-[4.5rem] sm:w-[4.5rem]",
                "bg-gradient-to-br from-white/15 to-white/5 shadow-2xl shadow-black/20 ring-1 ring-white/20 backdrop-blur-xl"
              )}
            >
              {isSignup ? (
                <UserPlus className="h-8 w-8 text-white/95 sm:h-9 sm:w-9" strokeWidth={1.5} aria-hidden />
              ) : (
                <Stethoscope className="h-8 w-8 text-white/95 sm:h-9 sm:w-9" strokeWidth={1.5} aria-hidden />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Form — full width below hero on mobile, half viewport on large screens */}
      <section
        className={cn(
          "relative z-[2] flex flex-1 flex-col justify-center overflow-y-auto border-t border-border/50",
          "bg-gradient-to-b from-background via-background to-muted/25 dark:from-background dark:via-background dark:to-muted/15",
          "px-6 py-10 sm:px-10 sm:py-14 lg:min-h-0 lg:border-l lg:border-t-0 lg:px-12 lg:py-16 xl:px-16"
        )}
      >
        <div className="mx-auto w-full max-w-md lg:max-w-lg">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground lg:text-left">
          {isSignup ? "Registration" : "Account access"}
        </p>
        <div
          className="mb-8 flex rounded-2xl border border-border/40 bg-muted/30 p-1.5 shadow-inner dark:bg-muted/20"
          role="tablist"
          aria-label="Sign in or create account"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isSignup}
            className={cn(
              "flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-200",
              !isSignup
                ? "bg-background text-foreground shadow-md shadow-black/[0.04] ring-1 ring-border/50 dark:shadow-black/20"
                : "text-muted-foreground hover:text-foreground"
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
              "flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-200",
              isSignup
                ? "bg-background text-foreground shadow-md shadow-black/[0.04] ring-1 ring-border/50 dark:shadow-black/20"
                : "text-muted-foreground hover:text-foreground"
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
                className="rounded-2xl border-red-200/80 bg-red-50/90 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
              >
                <AlertDescription className="text-sm font-medium leading-snug">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="auth-first-name" className={fieldLabel}>
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
                <Label htmlFor="auth-last-name" className={fieldLabel}>
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
              <Label htmlFor="auth-signup-email" className={fieldLabel}>
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
              <Label htmlFor="auth-phone" className={fieldLabel}>
                Phone{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
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
              <Label htmlFor="auth-signup-password" className={fieldLabel}>
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
                  className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg text-muted-foreground hover:bg-muted/80"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{PASSWORD_HINT}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-confirm-password" className={fieldLabel}>
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
              className={cn(
                primaryBtn,
                "mt-2 inline-flex items-center justify-center outline-none",
                "focus-visible:ring-2 focus-visible:ring-teal-600/30 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-400/25"
              )}
            >
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="rounded-2xl border-red-200/80 bg-red-50/90 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
              >
                <AlertDescription className="text-sm font-medium leading-snug">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-email" className={fieldLabel}>
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
              <Label htmlFor="auth-password" className={fieldLabel}>
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
                  className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg text-muted-foreground hover:bg-muted/80"
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
              className={cn(
                primaryBtn,
                "mt-2 inline-flex items-center justify-center outline-none",
                "focus-visible:ring-2 focus-visible:ring-teal-600/30 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-400/25"
              )}
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        <div className="mt-8 flex gap-3.5 rounded-2xl border border-teal-600/10 bg-gradient-to-br from-teal-50/80 to-emerald-50/30 px-4 py-4 dark:border-teal-500/15 dark:from-teal-950/30 dark:to-emerald-950/20">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600/10 dark:bg-teal-400/10">
            <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-400" aria-hidden />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isSignup
              ? "By continuing, you agree to use Clinical Lab responsibly. We protect your data with encryption in transit and at rest."
              : "Use a strong password and a device you trust. Never share your credentials with anyone."}
          </p>
        </div>

        {isDev && !isSignup && (
          <div className="mt-8 border-t border-border/60 pt-8">
            <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Local development
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillTestCredentials}
              disabled={isLoading}
              className="w-full rounded-xl border-dashed border-border/70"
            >
              Fill demo credentials
            </Button>
          </div>
        )}

        {isSignup ? (
          <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground lg:text-left">
            Already have an account?{" "}
            <button
              type="button"
              className="font-semibold text-teal-700 underline-offset-4 transition-colors hover:text-teal-800 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
              onClick={() => goToView("login")}
            >
              Sign in
            </button>
          </p>
        ) : (
          <div className="mt-8 space-y-2 text-center lg:text-left">
            <p className="text-sm leading-relaxed text-muted-foreground">
              New to Clinical Lab?{" "}
              <button
                type="button"
                className="font-semibold text-teal-700 underline-offset-4 transition-colors hover:text-teal-800 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
                onClick={() => goToView("signup")}
              >
                Create an account
              </button>
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground/90">
              Institutional access is managed by your administrator.
            </p>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
