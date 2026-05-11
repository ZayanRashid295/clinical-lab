"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Mail,
  RefreshCw,
  Settings,
  Shield,
  User as UserIcon,
  Hash,
  Phone,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { useToast } from "@/shared/ui/use-toast";
import { authService } from "@/shared/services/auth.service";
import { toastApiError } from "@/app/services/base/api-http-error";

function normalizeRoles(roles: unknown): string[] {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((r) => {
      if (typeof r === "string") return r.trim();
      const o = r as { name?: string; role?: { name?: string } };
      return String(o?.name || o?.role?.name || "").trim();
    })
    .filter(Boolean);
}

function displayNameFromParts(
  firstName: string,
  lastName: string,
  fallback?: Record<string, unknown> | null
): string {
  const combined = [firstName, lastName].filter((s) => s.trim()).join(" ").trim();
  if (combined) return combined;
  if (!fallback) return "—";
  const direct = fallback.name;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const fn = fallback.firstName;
  const ln = fallback.lastName;
  const parts = [fn, ln].filter((x) => typeof x === "string" && String(x).trim());
  if (parts.length) return parts.join(" ");
  return "—";
}

type Baseline = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [baseline, setBaseline] = useState<Baseline | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      if (!authService.isAuthenticated()) {
        router.replace("/");
        return;
      }
      const profile = await authService.getProfile();
      setUser(profile && typeof profile === "object" ? profile : null);
    } catch {
      setError("Could not refresh your profile from the server. Showing saved session data.");
      setUser(authService.getCurrentUser());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const fn = typeof user.firstName === "string" ? user.firstName : "";
    const ln = typeof user.lastName === "string" ? user.lastName : "";
    const em = typeof user.email === "string" ? user.email : "";
    const ph = typeof user.phone === "string" ? user.phone : "";
    setFirstName(fn);
    setLastName(ln);
    setEmailVal(em);
    setPhoneVal(ph);
    setBaseline({
      firstName: fn,
      lastName: ln,
      email: em,
      phone: ph,
    });
  }, [user]);

  const roles = useMemo(() => normalizeRoles(user?.roles), [user]);

  const displayName = useMemo(
    () => displayNameFromParts(firstName, lastName, user),
    [firstName, lastName, user]
  );

  const id = typeof user?.id === "string" ? user.id : "—";

  const initials = useMemo(() => {
    const fromNames = [firstName, lastName].map((s) => s.trim()).filter(Boolean);
    if (fromNames.length >= 2) {
      return `${fromNames[0].slice(0, 1)}${fromNames[1].slice(0, 1)}`.toUpperCase();
    }
    if (fromNames.length === 1) return fromNames[0].slice(0, 2).toUpperCase();
    const n =
      displayName !== "—"
        ? displayName
        : emailVal.trim()
          ? emailVal
          : "?";
    const ch = n.trim().slice(0, 1).toUpperCase();
    return ch || "?";
  }, [firstName, lastName, displayName, emailVal]);

  const dirty = useMemo(() => {
    if (!baseline) return false;
    return (
      firstName.trim() !== baseline.firstName.trim() ||
      lastName.trim() !== baseline.lastName.trim() ||
      emailVal.trim().toLowerCase() !== baseline.email.trim().toLowerCase() ||
      phoneVal.trim() !== baseline.phone.trim()
    );
  }, [baseline, firstName, lastName, emailVal, phoneVal]);

  const onSave = async () => {
    if (!baseline) return;
    setSaving(true);
    try {
      await authService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: emailVal.trim(),
        phone: phoneVal.trim() === "" ? null : phoneVal.trim(),
      });
      toast({
        title: "Profile updated",
        description: "Your details have been saved.",
      });
      await load({ silent: true });
    } catch (e) {
      toastApiError(toast, e, "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    if (!baseline) return;
    setFirstName(baseline.firstName);
    setLastName(baseline.lastName);
    setEmailVal(baseline.email);
    setPhoneVal(baseline.phone);
  };

  if (loading && !user) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center px-4 py-16">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary-600" />
        <span className="text-sm text-muted-foreground">Loading profile…</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button
            type="button"
            variant="ghost"
            className="-ml-2 mb-2 h-9 w-fit text-muted-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Profile
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Update how your name, email, and phone appear on your account. Changes apply
            everywhere you use Clinical Lab.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={refreshing}
          onClick={() => void load({ silent: true })}
          className="shrink-0"
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error ? (
        <Alert variant="default" className="border-amber-200/90 bg-amber-50/90 dark:border-amber-900/40 dark:bg-amber-950/25">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="border-slate-200/90 shadow-sm dark:border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-lg font-semibold text-white shadow-md shadow-primary-500/20"
                  aria-hidden
                >
                  {initials}
                </div>
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-xl">{displayName}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {emailVal.trim() || "—"}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 border-t border-slate-100 pt-6 dark:border-slate-800">
              <div>
                <h3 className="mb-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                  Your details
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-firstName">First name</Label>
                    <Input
                      id="profile-firstName"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-lastName">Last name</Label>
                    <Input
                      id="profile-lastName"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      autoComplete="email"
                      value={emailVal}
                      onChange={(e) => setEmailVal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="profile-phone">Phone (optional)</Label>
                    <Input
                      id="profile-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Leave blank to clear"
                      value={phoneVal}
                      onChange={(e) => setPhoneVal(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be unique if provided. Clear the field to remove your phone number.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void onSave()} disabled={saving || !dirty}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={onReset} disabled={!dirty || saving}>
                    Reset
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  If you change your email, sign out and sign in again if the app still shows your old
                  address in other tabs.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  User ID
                </p>
                <p className="mt-1 flex items-center gap-2 font-mono text-sm text-slate-900 dark:text-slate-100">
                  <Hash className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0 truncate">{id}</span>
                </p>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  Roles
                </p>
                {roles.length ? (
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => (
                      <Badge key={r} variant="secondary" className="font-normal">
                        {r.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No roles assigned.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200/90 shadow-sm dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Shortcuts</CardTitle>
              <CardDescription>Preferences and billing.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/my-subscription">
                  <CreditCard className="mr-2 h-4 w-4" />
                  My subscription
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/90 dark:border-slate-800">
            <CardContent className="flex gap-3 pt-6 text-sm text-muted-foreground">
              <UserIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
              <p>
                Role assignments are managed by administrators. For password changes, use your
                organization&apos;s reset flow or contact support if applicable.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
