"use client"

import { ClinicalMarkdown } from "./clinical-markdown"
import { humanizeKey } from "@/lib/medprep-shadow/shadow-test-report"
import type {
  LabResultRow,
  ReportSection,
  StructuredTestReport,
  TestReportHeader,
} from "@/lib/medprep-shadow/shadow-test-report"

function HeaderGrid({ header }: { header: TestReportHeader }) {
  const items = Object.entries(header).filter(
    ([, v]) => v != null && String(v).trim(),
  )

  if (!items.length) return null

  return (
    <div className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-600 dark:bg-slate-900/60 sm:grid-cols-2">
      {items.map(([key, value]) => (
        <div key={key} className="min-w-0">
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            {humanizeKey(key)}:{" "}
          </span>
          <span className="text-slate-900 dark:text-slate-100">{value}</span>
        </div>
      ))}
    </div>
  )
}

function flagClass(flag?: string): string {
  switch (flag) {
    case "H":
    case "L":
      return "font-semibold text-amber-700 dark:text-amber-400"
    case "CRIT":
      return "font-bold text-red-700 dark:text-red-400"
    case "N":
      return "text-emerald-700 dark:text-emerald-400"
    default:
      return "text-slate-500"
  }
}

function LabResultsTable({ rows }: { rows: LabResultRow[] }) {
  if (!rows.length) return null

  return (
    <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800">
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
              Analyte
            </th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
              Result
            </th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
              Unit
            </th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
              Reference
            </th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
              Flag
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.analyte}-${i}`}
              className="border-b border-slate-100 last:border-0 dark:border-slate-700"
            >
              <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                {row.analyte}
              </td>
              <td className="px-3 py-2 text-slate-800 dark:text-slate-200">
                {row.result}
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                {row.unit}
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                {row.referenceRange}
              </td>
              <td className={`px-3 py-2 ${flagClass(row.flag)}`}>
                {row.flag}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NarrativeSection({
  title,
  body,
}: {
  title: string
  body?: string
}) {
  if (!body?.trim()) return null
  return (
    <section className="mb-4">
      <h3 className="mb-2 border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wide text-slate-800 dark:border-slate-600 dark:text-slate-100">
        {title}
      </h3>
      <ClinicalMarkdown className="text-slate-800 dark:text-slate-200">
        {body}
      </ClinicalMarkdown>
    </section>
  )
}

function CustomSections({ sections }: { sections: ReportSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <NarrativeSection
          key={section.title}
          title={section.title}
          body={section.content}
        />
      ))}
    </>
  )
}

export function ClinicalTestReportView({
  report,
}: {
  report: StructuredTestReport
}) {
  const hasNarrative =
    report.summary ||
    report.labResults?.length ||
    report.sections?.length ||
    report.findings ||
    report.impression ||
    report.recommendations

  return (
    <div className="clinical-test-report">
      <HeaderGrid header={report.header} />
      {report.summary ? (
        <p className="mb-4 rounded-md border-l-4 border-indigo-500 bg-indigo-50/80 px-3 py-2 text-sm text-slate-800 dark:bg-indigo-950/40 dark:text-slate-200">
          <span className="font-semibold">Summary: </span>
          {report.summary}
        </p>
      ) : null}

      {report.labResults?.length ? (
        <LabResultsTable rows={report.labResults} />
      ) : null}

      {report.sections?.length ? (
        <CustomSections sections={report.sections} />
      ) : null}

      <NarrativeSection title="Findings" body={report.findings} />
      <NarrativeSection title="Impression" body={report.impression} />
      <NarrativeSection title="Recommendations" body={report.recommendations} />

      {!hasNarrative && report.fullReportMarkdown ? (
        <ClinicalMarkdown>{report.fullReportMarkdown}</ClinicalMarkdown>
      ) : null}
    </div>
  )
}
