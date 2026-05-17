import { describe, expect, it } from "vitest"
import { isDoctorClosingStatement } from "./shadow-consultation-end"

describe("isDoctorClosingStatement", () => {
  it("detects assessment-ready closings", () => {
    expect(
      isDoctorClosingStatement(
        "I believe I have enough information now to move forward with forming my assessment.",
      ),
    ).toBe(true)
  })

  it("rejects questions", () => {
    expect(isDoctorClosingStatement("Do you have chest pain at rest?")).toBe(false)
  })
})
