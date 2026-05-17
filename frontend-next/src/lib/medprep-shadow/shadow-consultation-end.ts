/**
 * Detects doctor lines that close the interview (not a new question).
 * Used when the regular doctor-question API wraps up without running termination.
 */
export function isDoctorClosingStatement(content: string): boolean {
  const text = String(content ?? "").trim()
  if (!text || text.endsWith("?")) return false

  return /enough information|sufficient (clinical )?data|formulate (my )?assessment|forming my assessment|conclude our consultation|move forward with forming|gathered enough|ready to (conclude|wrap up)|wrap up our (visit|consultation)|no (further|more) questions|end our consultation|assessment of your condition/i.test(
    text,
  )
}
