import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getModeById, type MedPrepModeId } from "./modes";

function standaloneAppUrl(path: string): string {
  const base =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_FYP_APP_URL?.replace(/\/$/, "")) ||
    "";
  if (!base) return "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface MedPrepModePageProps {
  modeId: MedPrepModeId;
}

export default function MedPrepModePage({ modeId }: MedPrepModePageProps) {
  const mode = getModeById(modeId);
  if (!mode) {
    return (
      <div className="p-6 max-w-3xl">
        <p className="text-gray-600">Unknown mode.</p>
        <Link href="/medprep-ai" className="text-blue-600 mt-4 inline-block">
          Back to MedPrepAI
        </Link>
      </div>
    );
  }

  const standalone = mode.standaloneAppPath
    ? standaloneAppUrl(mode.standaloneAppPath)
    : "";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Link
        href="/medprep-ai"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        MedPrepAI overview
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{mode.title}</h1>
        <p className="text-sm font-semibold text-indigo-700 mt-2">
          {mode.heroHeadline}
        </p>
        <p className="text-gray-700 mt-3 leading-relaxed">{mode.summary}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Highlights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          {mode.highlights.map((h) => (
            <div key={h.title} className="min-w-0">
              <p className="font-medium text-gray-900 text-sm">{h.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{h.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      {standalone ? (
        <a
          href={standalone}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Open related screen in standalone app
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <p className="text-sm text-gray-500">
          Set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_FYP_APP_URL</code>{" "}
          to deep-link into your standalone deployment (e.g.{" "}
          <code className="bg-gray-100 px-1 rounded">http://localhost:3001</code>
          ).
        </p>
      )}
    </div>
  );
}
