"use client";

import { useState, type FormEvent, type ReactNode } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const DEMO_PACK_FCPS = "fcps-medicine-and-allied";
export const DEMO_PACK_JCAT = "jcat-medicine-and-allied";
export const DEMO_TOKEN_KEY = "medprep.marketingDemoToken";
export const DEMO_PACK_KEY = "medprep.marketingDemoPack";

export type MarketingDemoPackId = typeof DEMO_PACK_FCPS | typeof DEMO_PACK_JCAT;

export function demoPackForTrack(track: "fcps" | "jcat"): MarketingDemoPackId {
  return track === "jcat" ? DEMO_PACK_JCAT : DEMO_PACK_FCPS;
}

export function productPathForDemoPack(pack: string): string {
  if (pack === DEMO_PACK_JCAT) return "/landing-page/jcat/medicine-and-allied";
  return "/landing-page/fcps/medicine-and-allied";
}

export type DemoFetchErrorKind = "empty_pack" | "unauthorized" | "generic";

export function parseMarketingDemoError(raw: string, fallback: string): {
  message: string;
  kind: DemoFetchErrorKind;
} {
  const text = (raw || "").trim();
  if (!text) return { message: fallback, kind: "generic" };

  try {
    const parsed = JSON.parse(text) as { message?: string | string[]; statusCode?: number };
    const msg = Array.isArray(parsed.message)
      ? parsed.message.join(" ")
      : typeof parsed.message === "string"
        ? parsed.message
        : fallback;
    const lower = msg.toLowerCase();
    if (
      lower.includes("no demo questions") ||
      lower.includes("not published") ||
      lower.includes("not available")
    ) {
      return { message: msg, kind: "empty_pack" };
    }
    if (parsed.statusCode === 401 || lower.includes("token") || lower.includes("unauthorized")) {
      return { message: msg, kind: "unauthorized" };
    }
    return { message: msg, kind: "generic" };
  } catch {
    if (/no demo questions/i.test(text)) {
      return { message: "No demo questions are published for this pack yet.", kind: "empty_pack" };
    }
    return { message: text, kind: "generic" };
  }
}

async function readErrorMessage(res: Response, fallback: string) {
  const text = await res.text();
  return parseMarketingDemoError(text, fallback);
}

export type DemoLeadPayload = {
  firstName: string;
  lastName: string;
  email: string;
  graduatingYear?: string;
  country?: string;
  pack?: string;
};

export async function submitMarketingDemoLead(payload: DemoLeadPayload) {
  const res = await fetch(`${API_BASE}/marketing/demo/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      pack: payload.pack || DEMO_PACK_FCPS,
    }),
  });
  if (!res.ok) {
    const { message } = await readErrorMessage(res, "Could not start the sample session");
    throw new Error(message);
  }
  return res.json() as Promise<{
    accessToken: string;
    pack: string;
    samplePath: string;
  }>;
}

export async function fetchMarketingDemoPack(pack: string, token: string) {
  const res = await fetch(
    `${API_BASE}/marketing/demo/packs/${encodeURIComponent(pack)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const { message, kind } = await readErrorMessage(res, "Could not load sample questions");
    const err = new Error(message) as Error & { kind?: DemoFetchErrorKind };
    err.kind = kind;
    throw err;
  }
  return res.json();
}

export function DemoLeadFormFields({
  onSuccess,
  badge,
  pack = DEMO_PACK_FCPS,
  submitSlot,
}: {
  badge: string;
  pack?: MarketingDemoPackId;
  onSuccess: (result: {
    accessToken: string;
    pack: string;
    samplePath: string;
  }) => void;
  submitSlot?: (props: { submitting: boolean }) => ReactNode;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [graduatingYear, setGraduatingYear] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !graduatingYear) {
      setError("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitMarketingDemoLead({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        graduatingYear,
        country: country || undefined,
        pack,
      });
      sessionStorage.setItem(DEMO_TOKEN_KEY, result.accessToken);
      sessionStorage.setItem(DEMO_PACK_KEY, result.pack);
      onSuccess(result);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h3 className="modal-title">
        Complete the form to explore MedPrepAI&apos;s {badge} demo
      </h3>
      {error ? (
        <p style={{ color: "#c23b3b", marginBottom: 12, fontSize: "0.9rem" }}>{error}</p>
      ) : null}
      <div className="field-row">
        <label className="field">
          First Name <span className="required">*</span>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label className="field">
          Last Name <span className="required">*</span>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          Email <span className="required">*</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          Graduating Year <span className="required">*</span>
          <select
            value={graduatingYear}
            onChange={(e) => setGraduatingYear(e.target.value)}
            required
          >
            <option value="" disabled>
              Please select...
            </option>
            <option>2026</option>
            <option>2027</option>
            <option>2028</option>
            <option>2029</option>
            <option>Already Graduated</option>
          </select>
        </label>
      </div>
      <label className="field" style={{ marginBottom: 22, display: "block" }}>
        Country
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="" disabled>
            Please select...
          </option>
          <option>Pakistan</option>
          <option>Other</option>
        </select>
      </label>
      {submitSlot ? (
        submitSlot({ submitting })
      ) : (
        <button type="submit" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Starting…" : "Submit"}
        </button>
      )}
    </form>
  );
}
