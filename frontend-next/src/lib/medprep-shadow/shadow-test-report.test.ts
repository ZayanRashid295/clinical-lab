import { describe, expect, it } from "vitest"
import {
  humanizeKey,
  normalizeStructuredTestReport,
  structuredFromApiPayload,
} from "./shadow-test-report"

describe("shadow-test-report", () => {
  it("uses reportCategory from API only", () => {
    const report = normalizeStructuredTestReport(
      { reportCategory: "laboratory", type: "CBC" },
      "CBC",
    )
    expect(report.category).toBe("laboratory")
  })

  it("defaults category to other when missing", () => {
    const report = normalizeStructuredTestReport({ type: "Custom panel" }, "Custom panel")
    expect(report.category).toBe("other")
  })

  it("builds lab table markdown from API rows", () => {
    const report = normalizeStructuredTestReport(
      {
        reportCategory: "laboratory",
        labResults: [
          {
            analyte: "WBC",
            result: "12.5",
            unit: "x10^9/L",
            referenceRange: "4.0-11.0",
            flag: "H",
          },
        ],
        impression: "Leukocytosis.",
      },
      "CBC",
    )
    expect(report.labResults).toHaveLength(1)
    expect(report.fullReportMarkdown).toContain("| WBC |")
    expect(report.fullReportMarkdown).toContain("Impression")
  })

  it("parses dynamic header keys", () => {
    const report = normalizeStructuredTestReport(
      {
        header: { patientName: "A. Smith", customField: "value" },
      },
      "Test",
    )
    expect(report.header.patientName).toBe("A. Smith")
    expect(report.header.customField).toBe("value")
    expect(humanizeKey("customField")).toBe("Custom Field")
  })

  it("structuredFromApiPayload prefers embedded structured", () => {
    const inner = normalizeStructuredTestReport(
      { type: "CXR", reportCategory: "imaging", impression: "Normal" },
      "CXR",
    )
    const outer = structuredFromApiPayload({ structured: inner, type: "CXR" }, "CXR")
    expect(outer.impression).toBe("Normal")
  })
})
