"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { authService } from "@/shared/services/auth.service";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";
import { useRouter } from "next/router";
import { routeAfterLogin } from "@/lib/auth/post-login-route";

export type AuthModalView = "login" | "signup";

const isDev = process.env.NODE_ENV === "development";
const LOGO_ICON = "/images/landing-v2/logo-icon.png";

export const PASSWORD_HINT =
  "Use at least 8 characters with at least one letter and one number.";

export function passwordMeetsPolicy(p: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(p);
}

export interface AuthScreenProps {
  initialView: AuthModalView;
  pendingPackageId?: string | null;
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
      router.replace(`/checkout?planId=${encodeURIComponent(pendingPackageId)}`);
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
        router.replace(`/checkout?planId=${encodeURIComponent(pendingPackageId)}`);
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
  const inputClass = "mkt-auth-input w-full !shadow-none disabled:opacity-50";

  return (
    <div className="mkt-auth-layout">
      <div className="mkt-auth-bg" aria-hidden />

      <div className={cn("mkt-auth-card", isSignup && "mkt-auth-card--signup")}>
        <div className="mkt-auth-card-header">
          <Link href="/landing-page" className="mkt-auth-brand">
            <span className="mkt-auth-brand-mark">
              <img src={LOGO_ICON} alt="" width={22} height={22} />
            </span>
            <span className="mkt-auth-brand-name">MedPrepAI</span>
          </Link>

          <h1 className="mkt-auth-card-title">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mkt-auth-card-lead">
            {isSignup
              ? "Start preparing with full explanations for every answer option."
              : "Sign in to continue your question bank and progress."}
          </p>
        </div>

        <div className="mkt-auth-tabs" role="tablist" aria-label="Sign in or create account">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignup}
            className={cn("mkt-auth-tab", !isSignup && "mkt-auth-tab--active")}
            onClick={() => goToView("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignup}
            className={cn("mkt-auth-tab", isSignup && "mkt-auth-tab--active")}
            onClick={() => goToView("signup")}
          >
            Create account
          </button>
        </div>

        {error && (
          <div className="mkt-auth-alert" role="alert">
            {error}
          </div>
        )}

        {isSignup ? (
          <form onSubmit={handleSignupSubmit} className="mkt-auth-form-stack">
            <div className="mkt-auth-name-row">
              <div className="mkt-auth-field">
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
              <div className="mkt-auth-field">
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

            <div className="mkt-auth-field">
              <Label htmlFor="auth-signup-email" className="mkt-auth-label">
                Email
              </Label>
              <Input
                id="auth-signup-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            <div className="mkt-auth-field">
              <Label htmlFor="auth-phone" className="mkt-auth-label">
                Phone <span className="mkt-auth-label-optional">(optional)</span>
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

            <div className="mkt-auth-field">
              <Label htmlFor="auth-signup-password" className="mkt-auth-label">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="auth-signup-password"
                  name="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={cn(inputClass, "!pr-10")}
                />
                <button
                  type="button"
                  className="mkt-auth-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                </button>
              </div>
              <p className="mkt-auth-hint">{PASSWORD_HINT}</p>
            </div>

            <div className="mkt-auth-field">
              <Label htmlFor="auth-confirm-password" className="mkt-auth-label">
                Confirm password
              </Label>
              <Input
                id="auth-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            <button type="submit" disabled={isLoading} className="mkt-auth-btn-primary">
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="mkt-auth-form-stack">
            <div className="mkt-auth-field">
              <Label htmlFor="auth-email" className="mkt-auth-label">
                Email
              </Label>
              <Input
                id="auth-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            <div className="mkt-auth-field">
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
                  className={cn(inputClass, "!pr-10")}
                />
                <button
                  type="button"
                  className="mkt-auth-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="mkt-auth-btn-primary">
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        <p className="mkt-auth-switch">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button type="button" className="mkt-auth-link" onClick={() => goToView("login")}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New to MedPrepAI?{" "}
              <button type="button" className="mkt-auth-link" onClick={() => goToView("signup")}>
                Create an account
              </button>
            </>
          )}
        </p>

        {isDev && !isSignup && (
          <div className="mkt-auth-dev">
            <button
              type="button"
              onClick={fillTestCredentials}
              disabled={isLoading}
              className="mkt-auth-btn-secondary"
            >
              Fill demo credentials
            </button>
          </div>
        )}

        <p className="mkt-auth-fine-print">
          Your data is encrypted in transit and at rest. Never share your password with anyone.
        </p>
      </div>
    </div>
  );
}
