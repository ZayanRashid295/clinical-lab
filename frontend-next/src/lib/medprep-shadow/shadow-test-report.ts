/** Structured medical test report — fields come from the generate-report API only. */

export type TestReportCategory =
  | "laboratory"
  | "imaging"
  | "ecg"
  | "procedure"
  | "other"

export type LabResultFlag = "H" | "L" | "N" | "CRIT" | ""

export interface LabResultRow {
  analyte: string
  result: string
  unit?: string
  referenceRange?: string
  flag?: LabResultFlag
}

/** Open header: any string fields the model returns (e.g. patientName, mrn, modality). */
export type TestReportHeader = Record<string, string | undefined>

export interface ReportSection {
  title: string
  content: string
}

export interface StructuredTestReport {
  type: string
  category: TestReportCategory
  header: TestReportHeader
  summary?: string
  labResults?: LabResultRow[]
  findings?: string
  impression?: string
  recommendations?: string
  sections?: ReportSection[]
  fullReportMarkdown: string
}

const VALID_CATEGORIES = new Set<TestReportCategory>([
  "laboratory",
  "imaging",
  "ecg",
  "procedure",
  "other",
])

function parseCategory(raw: unknown): TestReportCategory {
  const c = String(raw ?? "")
    .toLowerCase()
    .trim()
  return VALID_CATEGORIES.has(c as TestReportCategory)
    ? (c as TestReportCategory)
    : "other"
}

function normalizeFlag(raw: unknown): LabResultFlag {
  const f = String(raw ?? "")
    .trim()
    .toUpperCase()
  if (f === "H" || f === "L" || f === "N" || f === "CRIT") return f
  return ""
}

export function normalizeLabRows(rows: unknown): LabResultRow[] {
  if (!Array.isArray(rows)) return []
  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null
      const r = row as Record<string, unknown>
      const analyte = String(r.analyte ?? r.test ?? r.name ?? "").trim()
      const result = String(r.result ?? r.value ?? "").trim()
      if (!analyte || !result) return null
      return {
        analyte,
        result,
        unit: String(r.unit ?? "").trim() || undefined,
        referenceRange:
          String(r.referenceRange ?? r.reference ?? r.ref ?? "").trim() ||
          undefined,
        flag: normalizeFlag(r.flag ?? r.abnormalFlag),
      }
    })
    .filter((x): x is LabResultRow => x !== null)
}

function normalizeHeader(raw: unknown): TestReportHeader {
  if (!raw || typeof raw !== "object") return {}
  const out: TestReportHeader = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value == null) continue
    const s = String(value).trim()
    if (s) out[key] = s
  }
  return out
}

function normalizeSections(raw: unknown): ReportSection[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const sections = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const s = item as Record<string, unknown>
      const title = String(s.title ?? s.name ?? "").trim()
      const content = String(s.content ?? s.body ?? s.text ?? "").trim()
      if (!title || !content) return null
      return { title, content }
    })
    .filter((x): x is ReportSection => x !== null)
  return sections.length ? sections : undefined
}

function formatHeaderBlock(header: TestReportHeader): string {
  return Object.entries(header)
    .map(([key, value]) => `**${humanizeKey(key)}:** ${value}`)
    .join("\n")
}

export function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

function labTableMarkdown(rows: LabResultRow[]): string {
  if (!rows.length) return ""
  const header =
    "| Analyte | Result | Unit | Reference range | Flag |\n| --- | --- | --- | --- | --- |"
  const body = rows
    .map((r) => {
      const flag = r.flag || ""
      return `| ${r.analyte} | ${r.result} | ${r.unit ?? ""} | ${r.referenceRange ?? ""} | ${flag} |`
    })
    .join("\n")
  return `${header}\n${body}`
}

export function buildReportMarkdown(report: StructuredTestReport): string {
  const parts: string[] = [`## ${report.type}`, ""]
  const headerMd = formatHeaderBlock(report.header)
  if (headerMd) parts.push(headerMd, "")

  if (report.summary?.trim()) {
    parts.push(`**Summary:** ${report.summary.trim()}`, "")
  }

  if (report.labResults?.length) {
    parts.push("### Results", "", labTableMarkdown(report.labResults), "")
  }

  for (const section of report.sections ?? []) {
    parts.push(`### ${section.title}`, "", section.content.trim(), "")
  }

  if (report.findings?.trim()) {
    parts.push("### Findings", "", report.findings.trim(), "")
  }
  if (report.impression?.trim()) {
    parts.push("### Impression", "", report.impression.trim(), "")
  }
  if (report.recommendations?.trim()) {
    parts.push("### Recommendations", "", report.recommendations.trim(), "")
  }

  return parts.join("\n").trim()
}

/** Map API / model JSON to a structured report (no case-level defaults or inference). */
export function normalizeStructuredTestReport(
  raw: Record<string, unknown>,
  testType: string,
): StructuredTestReport {
  const type = String(raw.type ?? testType).trim() || testType
  const category = parseCategory(raw.reportCategory ?? raw.category)

  const labResults = normalizeLabRows(
    raw.labResults ?? raw.results ?? raw.labRows,
  )

  const structured: StructuredTestReport = {
    type,
    category,
    header: normalizeHeader(raw.header),
    summary: String(raw.summary ?? "").trim() || undefined,
    labResults: labResults.length ? labResults : undefined,
    findings: String(raw.findings ?? "").trim() || undefined,
    impression: String(raw.impression ?? "").trim() || undefined,
    recommendations:
      String(raw.recommendations ?? raw.recommendation ?? "").trim() ||
      undefined,
    sections: normalizeSections(raw.sections),
    fullReportMarkdown: "",
  }

  const explicitMarkdown = String(
    raw.fullReportMarkdown ?? raw.fullReport ?? raw.reportContent ?? "",
  ).trim()

  structured.fullReportMarkdown =
    explicitMarkdown || buildReportMarkdown(structured)

  return structured
}

/** Prefer embedded `structured`; otherwise parse the report object from the API. */
export function structuredFromApiPayload(
  raw: Record<string, unknown>,
  testType: string,
): StructuredTestReport {
  if (raw.structured && typeof raw.structured === "object") {
    return normalizeStructuredTestReport(
      raw.structured as Record<string, unknown>,
      testType,
    )
  }
  return normalizeStructuredTestReport(raw, testType)
}
