import React from "react";
import Link from "next/link";
import { MEDPREP_MODES } from "./modes";

export default function MedPrepOverviewPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Choose Your Learning Mode
          </h1>
          <p className="text-gray-700 mt-2 leading-relaxed max-w-2xl">
            Select how you want to practice with medical cases
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {MEDPREP_MODES.map((mode) => (
          <div
            key={mode.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-900">{mode.title}</h2>
            <p className="text-sm font-semibold text-indigo-700 mt-2">
              {mode.heroHeadline}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3 flex-1">
              {mode.summary}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
              {mode.highlights.map((h) => (
                <div key={h.title} className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">
                    {h.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-snug">
                    {h.subtitle}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/medprep-ai/${mode.id}`}
                className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 text-center"
              >
                {mode.ctaLabel}
              </Link>
              <Link
                href="/"
                className="inline-flex justify-center text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
