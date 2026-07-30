"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import UnifiedQuestionPreview from "../question-generator/unified-question-preview";
import type { QuestionCreatorData } from "../question-generator/question-creator/types";
import type { ContentBlock } from "../question-generator/rich-editor/types";
import {
  DEMO_PACK_FCPS,
  DEMO_PACK_KEY,
  DEMO_TOKEN_KEY,
  fetchMarketingDemoPack,
  productPathForDemoPack,
  type DemoFetchErrorKind,
  type MarketingDemoPackId,
} from "./landing-demo-lead";
import type { ExamTrack } from "./landing-v2-data";

const DEMO_SAMPLE_CHROME_CSS = `
  .demo-sample-shell {
    background: var(--mkt-bg);
    color: var(--mkt-text);
  }
  .demo-sample-nav-secondary,
  .demo-sample-nav-primary {
    appearance: none;
    font-family: inherit;
    font-size: 0.9375rem;
    font-weight: 650;
    border-radius: 999px;
    padding: 0.55rem 1.15rem;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
  }
  .demo-sample-nav-secondary {
    border: 1px solid var(--mkt-border);
    background: var(--mkt-bg-elevated);
    color: var(--mkt-text);
  }
  .demo-sample-nav-secondary:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--mkt-accent) 40%, var(--mkt-border));
  }
  .demo-sample-nav-secondary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .demo-sample-nav-primary {
    border: none;
    background: var(--mkt-accent);
    color: #fff;
    padding: 0.65rem 1.35rem;
  }
  .demo-sample-nav-primary:hover {
    background: var(--mkt-accent-hover);
  }
  .demo-sample-status {
    height: 100%;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--mkt-accent) 14%, transparent), transparent 70%),
      linear-gradient(180deg, var(--mkt-bg) 0%, var(--mkt-bg-muted) 100%);
  }
  .demo-sample-status-inner {
    width: min(520px, 100%);
    text-align: center;
  }
  .demo-sample-status-mark {
    width: 72px;
    height: 72px;
    margin: 0 auto 24px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--mkt-accent) 12%, var(--mkt-bg-elevated));
    border: 1px solid color-mix(in srgb, var(--mkt-accent) 28%, var(--mkt-border));
    box-shadow: 0 12px 40px -18px color-mix(in srgb, var(--mkt-accent) 45%, transparent);
    color: var(--mkt-accent);
  }
  .demo-sample-status-mark svg {
    width: 30px;
    height: 30px;
  }
  .demo-sample-status-eyebrow {
    margin: 0 0 10px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mkt-accent);
  }
  .demo-sample-status-title {
    margin: 0 0 12px;
    font-size: clamp(1.55rem, 3.6vw, 2.1rem);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: var(--mkt-text);
  }
  .demo-sample-status-lead {
    margin: 0 auto 28px;
    max-width: 40ch;
    font-size: 1.0625rem;
    line-height: 1.55;
    color: var(--mkt-text-muted);
  }
  .demo-sample-status-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }
`;

function DemoSampleStatus({
  eyebrow,
  title,
  lead,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="demo-sample-shell demo-sample-status">
      <style>{DEMO_SAMPLE_CHROME_CSS}</style>
      <div className="demo-sample-status-inner">
        <div className="demo-sample-status-mark" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 7h8M8 11h6" />
          </svg>
        </div>
        <p className="demo-sample-status-eyebrow">{eyebrow}</p>
        <h1 className="demo-sample-status-title">{title}</h1>
        <p className="demo-sample-status-lead">{lead}</p>
        <div className="demo-sample-status-actions">
          <button type="button" className="demo-sample-nav-primary" onClick={onPrimary}>
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary ? (
            <button type="button" className="demo-sample-nav-secondary" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function mapPackQuestionToCreatorData(
  q: any,
  pack: MarketingDemoPackId,
): QuestionCreatorData {
  const normalizeBlock = (block: any, index: number): ContentBlock => {
    const rawType = String(block?.type || "").toLowerCase();
    const isPerAnswerExplanation =
      rawType === "per_answer_explanation" ||
      rawType === "per-answer-explanation" ||
      block?.data?.placeholder === true ||
      block?.data?.isPerAnswerExplanation === true;

    return {
      ...block,
      id: String(block?.id || `demo-block-${index}`),
      type: isPerAnswerExplanation
        ? "per-answer-explanation"
        : rawType === "images"
          ? "image"
          : rawType as ContentBlock["type"],
      order: typeof block?.order === "number" ? block.order : index,
      data: block?.data && typeof block.data === "object" ? block.data : {},
    };
  };

  const mainExplanation = Array.isArray(q.explanation)
    ? q.explanation.map(normalizeBlock)
    : [];
  const perAnswerExplanations: Record<string, ContentBlock[]> =
    q.perAnswerExplanations && typeof q.perAnswerExplanations === "object"
      ? Object.fromEntries(
          Object.entries(q.perAnswerExplanations).map(([label, blocks]) => [
            label,
            Array.isArray(blocks) ? blocks.map(normalizeBlock) : [],
          ]),
        )
      : {};

  return {
    stem: Array.isArray(q.questionStemBlocks) ? q.questionStemBlocks : [],
    choices: Array.isArray(q.options)
      ? q.options.map((opt: any) => ({
          label: opt?.label || "",
          value: opt?.value || opt?.label || "",
          text: opt?.text || "",
          correct: Boolean(opt?.correct),
        }))
      : [],
    mainExplanation,
    perAnswerExplanations,
    metadata: {
      systemId: q.systemId || "",
      topicId: q.topicId || "",
      title: q.mcqTitle || q.title || "",
      subject: q.subject || "",
      system: q.system || "",
      parsedTopicName: q.topic || "",
      isDemo: true,
      demoPack: pack,
    },
  };
}

export function LandingDemoPreviewSample({
  pack = DEMO_PACK_FCPS,
  track = "fcps",
  onBeginPrep,
}: {
  pack?: MarketingDemoPackId;
  track?: ExamTrack;
  onBeginPrep: () => void;
}) {
  const router = useRouter();
  const productPath = productPathForDemoPack(pack);
  const trackLabel = track === "jcat" ? "MDMS/ JCAT" : "FCPS-1";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<DemoFetchErrorKind>("generic");
  const [items, setItems] = useState<
    Array<{ id: string; displayQuestionId: string | null; data: QuestionCreatorData }>
  >([]);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setErrorKind("generic");
      try {
        const token = sessionStorage.getItem(DEMO_TOKEN_KEY);
        const storedPack = sessionStorage.getItem(DEMO_PACK_KEY);
        if (!token) {
          setErrorKind("unauthorized");
          setError("Start from View sample questions to unlock this demo.");
          setLoading(false);
          return;
        }
        if (storedPack && storedPack !== pack) {
          setErrorKind("unauthorized");
          setError(
            "This sample belongs to a different product. Open View sample questions from this page to continue.",
          );
          setLoading(false);
          return;
        }
        const data = await fetchMarketingDemoPack(pack, token);
        if (cancelled) return;
        const mapped = (data.questions || []).map((q: any) => {
          const humanId =
            q.displayQuestionId ||
            (typeof q.questionId === "string" && !q.questionId.startsWith("cm")
              ? q.questionId
              : null);
          return {
            id: q.id,
            displayQuestionId: humanId,
            data: mapPackQuestionToCreatorData(q, pack),
          };
        });
        setItems(mapped);
      } catch (e: any) {
        if (!cancelled) {
          setErrorKind((e?.kind as DemoFetchErrorKind) || "generic");
          setError(e?.message || "Failed to load demo");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [pack]);

  if (loading) {
    return (
      <div
        className="demo-sample-shell demo-sample-status"
        style={{ color: "var(--mkt-text-muted)" }}
      >
        <style>{DEMO_SAMPLE_CHROME_CSS}</style>
        <div className="demo-sample-status-inner">
          <p className="demo-sample-status-eyebrow">{trackLabel}</p>
          <h1 className="demo-sample-status-title">Loading sample questions</h1>
          <p className="demo-sample-status-lead">
            Preparing your Medicine and Allied preview…
          </p>
        </div>
      </div>
    );
  }

  if (error || !items.length) {
    const isEmpty =
      errorKind === "empty_pack" || (!error && !items.length);
    const isAuth = errorKind === "unauthorized";

    if (isEmpty) {
      return (
        <DemoSampleStatus
          eyebrow={`${trackLabel} · Medicine and Allied`}
          title="Sample questions coming soon"
          lead="We're finishing this product's preview set. You can still explore the product page or create an account to access the full QBank when you're ready."
          primaryLabel="Back to product"
          onPrimary={() => void router.push(productPath)}
          secondaryLabel="Create your account"
          onSecondary={onBeginPrep}
        />
      );
    }

    if (isAuth) {
      return (
        <DemoSampleStatus
          eyebrow={`${trackLabel} · Medicine and Allied`}
          title="Unlock the sample first"
          lead={error || "Use View sample questions on the product page to start a short preview session."}
          primaryLabel="Back to product"
          onPrimary={() => void router.push(productPath)}
        />
      );
    }

    return (
      <DemoSampleStatus
        eyebrow={`${trackLabel} · Medicine and Allied`}
        title="Couldn't load the sample"
        lead={
          error && !error.trim().startsWith("{")
            ? error
            : "Something went wrong while loading this preview. Please return to the product page and try again."
        }
        primaryLabel="Back to product"
        onPrimary={() => void router.push(productPath)}
        secondaryLabel="Create your account"
        onSecondary={onBeginPrep}
      />
    );
  }

  if (finished) {
    return (
      <div
        className="demo-sample-complete"
        style={{
          height: "100%",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--mkt-accent) 14%, transparent), transparent 70%), linear-gradient(180deg, var(--mkt-bg) 0%, var(--mkt-bg-muted) 100%)",
        }}
      >
        <style>{`
          @keyframes demo-complete-in {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes demo-complete-ring {
            from { transform: scale(0.72); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes demo-complete-check {
            from { stroke-dashoffset: 28; }
            to { stroke-dashoffset: 0; }
          }
          .demo-sample-complete-inner {
            width: min(560px, 100%);
            text-align: center;
            animation: demo-complete-in 0.55s ease-out both;
          }
          .demo-sample-complete-mark {
            width: 72px;
            height: 72px;
            margin: 0 auto 28px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: color-mix(in srgb, var(--mkt-accent) 12%, var(--mkt-bg-elevated));
            border: 1px solid color-mix(in srgb, var(--mkt-accent) 28%, var(--mkt-border));
            box-shadow: 0 12px 40px -18px color-mix(in srgb, var(--mkt-accent) 45%, transparent);
            animation: demo-complete-ring 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .demo-sample-complete-mark svg {
            width: 34px;
            height: 34px;
          }
          .demo-sample-complete-mark path {
            fill: none;
            stroke: var(--mkt-accent);
            stroke-width: 2.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 28;
            stroke-dashoffset: 28;
            animation: demo-complete-check 0.45s ease-out 0.25s forwards;
          }
          .demo-sample-complete-eyebrow {
            margin: 0 0 12px;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--mkt-accent);
          }
          .demo-sample-complete-title {
            margin: 0 0 14px;
            font-size: clamp(1.75rem, 4vw, 2.35rem);
            font-weight: 700;
            line-height: 1.15;
            letter-spacing: -0.02em;
            color: var(--mkt-text);
          }
          .demo-sample-complete-title span {
            color: var(--mkt-accent);
          }
          .demo-sample-complete-lead {
            margin: 0 auto 28px;
            max-width: 38ch;
            font-size: 1.0625rem;
            line-height: 1.55;
            color: var(--mkt-text-muted);
          }
          .demo-sample-complete-meta {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px 18px;
            margin: 0 0 32px;
            padding: 0;
            list-style: none;
            font-size: 0.875rem;
            color: var(--mkt-text-subtle, var(--mkt-text-muted));
          }
          .demo-sample-complete-meta li {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .demo-sample-complete-meta li::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--mkt-accent);
            opacity: 0.75;
          }
          .demo-sample-complete-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
            animation: demo-complete-in 0.55s ease-out 0.12s both;
          }
          .demo-sample-complete-primary,
          .demo-sample-complete-secondary {
            appearance: none;
            font-family: inherit;
            font-size: 0.9375rem;
            font-weight: 650;
            border-radius: 999px;
            padding: 0.85rem 1.55rem;
            cursor: pointer;
            transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          }
          .demo-sample-complete-primary {
            border: none;
            color: #fff;
            background: var(--mkt-accent);
            box-shadow: 0 10px 28px -12px color-mix(in srgb, var(--mkt-accent) 70%, transparent);
          }
          .demo-sample-complete-primary:hover {
            background: var(--mkt-accent-hover);
            transform: translateY(-1px);
          }
          .demo-sample-complete-secondary {
            border: 1px solid var(--mkt-border);
            color: var(--mkt-text);
            background: color-mix(in srgb, var(--mkt-bg-elevated) 88%, transparent);
          }
          .demo-sample-complete-secondary:hover {
            border-color: color-mix(in srgb, var(--mkt-accent) 40%, var(--mkt-border));
            background: var(--mkt-bg-elevated);
          }
        `}</style>

        <div className="demo-sample-complete-inner">
          <div className="demo-sample-complete-mark" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <p className="demo-sample-complete-eyebrow">Sample complete</p>
          <h1 className="demo-sample-complete-title">
            You’ve previewed <span>{items.length}</span> Medicine and Allied questions
          </h1>
          <p className="demo-sample-complete-lead">
            Keep the same exam-level format — every option explained — across the full {trackLabel} QBank.
          </p>

          <ul className="demo-sample-complete-meta">
            <li>{trackLabel}</li>
            <li>Medicine and Allied</li>
            <li>{items.length} of {items.length} answered</li>
          </ul>

          <div className="demo-sample-complete-actions">
            <button
              type="button"
              className="demo-sample-complete-primary"
              onClick={onBeginPrep}
            >
              Create your account
            </button>
            <button
              type="button"
              className="demo-sample-complete-secondary"
              onClick={() => void router.push(productPath)}
            >
              Back to product
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = items[index];

  return (
    <div className="demo-sample-shell flex flex-col h-full min-h-0 overflow-hidden">
      <style>{`
        ${DEMO_SAMPLE_CHROME_CSS}
        .demo-sample-topbar {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--mkt-border);
          background: color-mix(in srgb, var(--mkt-bg-elevated) 92%, transparent);
          color: var(--mkt-text);
        }
        .demo-sample-topbar-label {
          margin: 0;
          font-size: 0.875rem;
          color: var(--mkt-text-muted);
        }
        .demo-sample-nav-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.75rem 0 0.5rem;
        }
        .demo-sample-nav-count {
          margin: 0;
          min-width: 4.5rem;
          text-align: center;
          font-size: 1.125rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: var(--mkt-text);
        }
        @media (min-width: 640px) {
          .demo-sample-nav-count { font-size: 1.25rem; }
        }
      `}</style>

      <div className="demo-sample-topbar">
        <p className="demo-sample-topbar-label">
          {trackLabel} · Medicine and Allied sample
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <UnifiedQuestionPreview
          key={current.id}
          questionData={current.data}
          questionId={current.displayQuestionId || String(index + 1)}
          mode="practice"
          belowChoices={
            <div className="demo-sample-nav-row">
              <button
                type="button"
                className="demo-sample-nav-secondary"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Previous
              </button>
              <p className="demo-sample-nav-count">
                {index + 1} / {items.length}
              </p>
              <button
                type="button"
                className="demo-sample-nav-primary"
                onClick={() => {
                  if (index + 1 >= items.length) setFinished(true);
                  else setIndex((i) => i + 1);
                }}
              >
                {index + 1 >= items.length ? "See results" : "Next question"}
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
}
