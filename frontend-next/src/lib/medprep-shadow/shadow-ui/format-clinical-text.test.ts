import { describe, expect, it } from "vitest"
import { formatClinicalText } from "./format-clinical-text"

describe("formatClinicalText", () => {
  it("strips wrapping quotes and entities", () => {
    expect(formatClinicalText('"Oh, doctor, it hurts."')).toBe("Oh, doctor, it hurts.")
    expect(formatClinicalText("&quot;Hello&quot;")).toBe('"Hello"')
  })

  it("unwraps markdown fences", () => {
    expect(formatClinicalText('```json\n{"a":1}\n```')).toBe('{"a":1}')
  })
})
