import { BEST_GEMINI_MODEL, GEMINI_TURN_MODEL, runNewGemini } from "@/lib/fyp/llm-gemini"
import { normalizeStructuredTestReport } from "@/lib/medprep-shadow/shadow-test-report"

/** Higher-quality model for one-shot clinical documents (SOAP, Rx). */
const CLINICAL_DOC_MODEL =
  process.env.MEDPREP_GEMINI_DOC_MODEL?.trim() || BEST_GEMINI_MODEL

function buildCaseContextBlock(currentCase: Record<string, unknown>): string {
  const symptoms = Array.isArray(currentCase.symptoms)
    ? (currentCase.symptoms as string[]).join(", ")
    : ""
  return [
    `Case title: ${currentCase.title || "Clinical case"}`,
    `Working disease label (teaching case): ${currentCase.disease || "See transcript"}`,
    `Specialty: ${currentCase.specialty || "General medicine"}`,
    `Chief complaint: ${currentCase.chiefComplaint || "Not specified"}`,
    `Symptoms on file: ${symptoms || "Not listed"}`,
    `Difficulty: ${currentCase.difficulty || "intermediate"}`,
  ].join("\n")
}

function stripMarkdownJsonFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

/** First balanced `{...}` or whole-string JSON — avoids greedy-regex parse errors. */
function extractJsonObject(text: string): Record<string, unknown> {
  const cleaned = stripMarkdownJsonFence(text)
  if (!cleaned) throw new Error("No JSON object in model output")

  try {
    const direct = JSON.parse(cleaned) as unknown
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
      return direct as Record<string, unknown>
    }
  } catch {
    // fall through to bracket scan
  }

  const start = cleaned.indexOf("{")
  if (start === -1) throw new Error("No JSON object in model output")

  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i]
    if (inString) {
      if (escape) escape = false
      else if (c === "\\") escape = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') {
      inString = true
      continue
    }
    if (c === "{") depth++
    else if (c === "}") {
      depth--
      if (depth === 0) {
        const candidate = cleaned.slice(start, i + 1)
        return JSON.parse(candidate) as Record<string, unknown>
      }
    }
  }
  throw new Error("No JSON object in model output")
}

function extractJsonArray(text: string): unknown[] {
  const cleaned = stripMarkdownJsonFence(text)
  if (!cleaned) throw new Error("No JSON array in model output")

  try {
    const direct = JSON.parse(cleaned) as unknown
    if (Array.isArray(direct)) return direct
  } catch {
    // fall through
  }

  const start = cleaned.indexOf("[")
  if (start === -1) throw new Error("No JSON array in model output")

  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i]
    if (inString) {
      if (escape) escape = false
      else if (c === "\\") escape = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') {
      inString = true
      continue
    }
    if (c === "[") depth++
    else if (c === "]") {
      depth--
      if (depth === 0) {
        const candidate = cleaned.slice(start, i + 1)
        return JSON.parse(candidate) as unknown[]
      }
    }
  }
  throw new Error("No JSON array in model output")
}

function normalizeDifferentialRows(rows: unknown[]): Record<string, unknown>[] {
  if (!rows.length) return []
  const out = rows.map((item) => {
    const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    let p = Number(o.probability ?? 0)
    if (p > 0 && p <= 1) p = Math.round(p * 100)
    const reason = String(o.reason ?? o.reasoning ?? "").trim()
    let cat = String(o.category || "secondary").toLowerCase()
    if (!["primary", "secondary", "rare", "rule-out"].includes(cat)) cat = "secondary"
    return {
      condition: String(o.condition || "Unspecified").trim(),
      probability: Math.max(0, Math.min(100, Math.round(p))),
      reason: reason || "Clinical correlation needed.",
      category: cat,
    }
  })
  const sum = out.reduce((s, r) => s + (r.probability as number), 0)
  if (sum !== 100 && out.length > 0) {
    const scale = 100 / sum
    out.forEach((r) => {
      r.probability = Math.max(1, Math.round((r.probability as number) * scale))
    })
    const drift = 100 - out.reduce((s, r) => s + (r.probability as number), 0)
    ;(out[0].probability as number) += drift
  }
  return out
}

export async function handleDoctorThought(body: Record<string, unknown>): Promise<{
  thought: string
  redFlags: string
  raw: string
}> {
  const currentCase = body.currentCase as Record<string, unknown> | undefined
  const patientInfo = body.patientInfo as Record<string, unknown> | undefined
  const conversation = Array.isArray(body.conversation) ? body.conversation : []
  const reports = Array.isArray(body.reports) ? body.reports : []
  const instruction = typeof body.instruction === "string" ? body.instruction : ""
  const isFollowUp = body.mode === "follow-up" || body.isFollowUp === true

  const reportsBlock =
    reports.length > 0
      ? `REPORTS:\n${reports
          .map(
            (r: any) =>
              `- ${r.type}: ${String(r.summary || r.fullReport || "").slice(0, 800)}`,
          )
          .join("\n")}`
      : ""

  const conv = conversation
    .map((m: any) => `${m.role}: ${m.content}`)
    .join("\n")

  const system = `You are an attending physician supervising an AI doctor interview (educational simulation).
You do NOT know the hidden diagnosis label—only what appears in the transcript and structured fields.
Output ONLY valid JSON with keys: reasoning (string, exactly two sentences), redFlags (string, one sentence or "None").
No markdown fences. Be precise, professional, and non-repetitive.`

  const user = `PATIENT: ${patientInfo?.name || "Patient"}, ${patientInfo?.age ?? "?"}y, ${patientInfo?.gender || "?"}
Chief complaint: ${currentCase?.chiefComplaint || "N/A"}
Symptoms: ${Array.isArray(currentCase?.symptoms) ? (currentCase!.symptoms as string[]).join(", ") : ""}
${reportsBlock}

CONVERSATION (latest last):
${conv || "(empty)"}

${isFollowUp ? "This is a FOLLOW-UP visit—weight discussion toward results and plan, not re-taking full history.\n" : ""}
${instruction || "Summarize clinical reasoning for this step."}`

  const raw = await runNewGemini(GEMINI_TURN_MODEL, system, user, false, 0, false, 0.35, 384)
  const parsed = extractJsonObject(raw)
  return {
    thought: String(parsed.reasoning ?? "").trim(),
    redFlags: String(parsed.redFlags ?? "None").trim(),
    raw,
  }
}

export async function handleDifferentialDiagnosis(body: Record<string, unknown>): Promise<unknown[]> {
  const currentCase = body.currentCase as Record<string, unknown> | undefined
  const patientInfo = body.patientInfo as Record<string, unknown> | undefined
  const doctorQuestion = String(body.doctorQuestion || "")
  const doctorThought = String(body.doctorThought || "")
  const patientResponse = String(body.patientResponse || "")
  const reports = Array.isArray(body.reports) ? body.reports : []

  const reportsBlock =
    reports.length > 0
      ? `REPORTS:\n${reports
          .map((r: any) => `- ${r.type}: ${String(r.summary || "").slice(0, 600)}`)
          .join("\n")}`
      : ""

  const system = `Return ONLY a JSON array of exactly 4 objects with keys:
condition (string), probability (integer 0-100, four must sum to 100), reason (string, one sentence), category (one of: primary, secondary, rare, rule-out).
Probabilities must reflect the conversation and any report data—not random noise.`

  const user = `Patient: ${patientInfo?.age || "?"}y ${patientInfo?.gender || ""}
Chief complaint: ${currentCase?.chiefComplaint || ""}
Symptoms: ${Array.isArray(currentCase?.symptoms) ? (currentCase!.symptoms as string[]).join(", ") : ""}
${reportsBlock}

Doctor question: ${doctorQuestion}
Doctor reasoning: ${doctorThought}
Patient reply: ${patientResponse}`

  const raw = await runNewGemini(GEMINI_TURN_MODEL, system, user, false, 0, false, 0.25, 768)
  let arr: unknown[]
  try {
    arr = extractJsonArray(raw)
  } catch {
    const obj = extractJsonObject(raw)
    const nested = obj.diagnoses ?? obj.diagnosis
    if (!Array.isArray(nested)) throw new Error("Expected JSON array of diagnoses")
    arr = nested as unknown[]
  }
  return normalizeDifferentialRows(arr)
}

function trimTranscriptForTermination(
  messages: Array<{ role?: string; content?: string }>,
  maxMessages = 14,
): string {
  const slice = messages.slice(-maxMessages)
  return slice
    .map((m) => `${m.role ?? "?"}: ${String(m.content ?? "").slice(0, 420)}`)
    .join("\n")
}

export async function handleCheckTermination(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const conversationHistory = Array.isArray(body.conversationHistory)
    ? (body.conversationHistory as Array<{ role?: string; content?: string }>)
    : []
  const isFollowUp = body.mode === "follow-up" || body.isFollowUp === true
  const doctorN = conversationHistory.filter((m) => m.role === "doctor").length
  const patientN = conversationHistory.filter((m) => m.role === "patient").length
  const exchanges = Math.min(doctorN, patientN)
  const total = conversationHistory.length

  if (!isFollowUp && exchanges < 2) {
    return {
      success: true,
      shouldTerminate: false,
      diagnosticClarity: "insufficient",
      reasoning: "Need at least two doctor–patient exchanges.",
      confidence: 0.2,
    }
  }

  if (isFollowUp && (total < 4 || exchanges < 2)) {
    return {
      success: true,
      shouldTerminate: false,
      diagnosticClarity: "insufficient",
      reasoning: "Follow-up needs at least two exchanges before wrapping up.",
      confidence: 0.25,
    }
  }

  const conv = trimTranscriptForTermination(conversationHistory)
  const system = `Teaching-case interview coach. Return ONLY JSON:
{"shouldTerminate":boolean,"diagnosticClarity":"insufficient"|"sufficient"|"complete","confidence":number,"reasoning":string}

Guidelines (practical, not exhaustive):
- shouldTerminate true when HPI, key positives/negatives, and enough context for a working DDx are present (often ~4+ doctor turns).
- Prefer wrapping up over prolonging; do not require full workup or every red flag explicitly ruled out.
- diagnosticClarity: "sufficient" or "complete" when ready to conclude; "insufficient" only if major gaps remain.
- reasoning: one short sentence. confidence in [0,1].`

  const user = `Session: ${isFollowUp ? "FOLLOW_UP" : "INITIAL"} | exchanges: ${exchanges} | messages: ${total}

Recent transcript:
${conv || "(empty)"}`

  const raw = await runNewGemini(GEMINI_TURN_MODEL, system, user, false, 0, false, 0.25, 220)
  const parsed = extractJsonObject(raw)
  return {
    success: true,
    shouldTerminate: Boolean(parsed.shouldTerminate),
    diagnosticClarity: String(parsed.diagnosticClarity || "insufficient"),
    confidence: Number(parsed.confidence ?? 0.5),
    reasoning: String(parsed.reasoning || ""),
  }
}

export async function handleGenerateReport(
  body: Record<string, unknown>,
): Promise<{ success: true; reports: unknown[] }> {
  const requested = Array.isArray(body.requestedReports) ? body.requestedReports : []
  const patientInfo = (body.patientInfo as Record<string, unknown>) || {}
  const currentCase = (body.currentCase as Record<string, unknown>) || {}
  const conversationContext = body.conversationContext
  const doctorThought = typeof body.doctorThought === "string" ? body.doctorThought : ""
  const soapNote = typeof body.soapNote === "string" ? body.soapNote.slice(0, 4000) : ""
  const differentialDiagnosis = body.differentialDiagnosis

  const system = `You are a board-certified specialist producing realistic EDUCATIONAL test reports for medical students.

Return ONLY JSON:
{
  "reports": [{
    "type": "exact test name from the request",
    "reportCategory": "laboratory" | "imaging" | "ecg" | "procedure" | "other",
    "header": { "<fieldName>": "<value>", ... },
    "summary": "optional one-line summary",
    "labResults": [{ "analyte": "", "result": "", "unit": "", "referenceRange": "", "flag": "N|H|L|CRIT" }],
    "findings": "markdown narrative when appropriate",
    "impression": "diagnostic impression when appropriate",
    "recommendations": "optional follow-up",
    "sections": [{ "title": "", "content": "markdown" }]
  }]
}

RULES:
- One report per requested test; "type" must match the request exactly.
- Choose reportCategory and which fields to populate based on the test type and clinical context (labs → labResults table; imaging → findings/impression; ECG → findings/impression; use sections[] for any extra blocks the format needs).
- header must use realistic identifiers and timestamps derived from the case and PATIENT block (include patientName, age, sex, and any accession/MRN/provider/datetime fields appropriate to the test).
- labResults flags must be supplied by you (H/L/N/CRIT); align values with case, SOAP, and differential.
- Do not contradict the case assessment or invent unrelated diagnoses.
- Omit optional fields rather than leaving placeholders.`

  const user = `REQUESTED TESTS: ${requested.join(", ")}

CASE:
${buildCaseContextBlock(currentCase)}

PATIENT: ${JSON.stringify(patientInfo)}

SOAP (truncated):
${soapNote || "(none)"}

DIFFERENTIAL:
${JSON.stringify(differentialDiagnosis || []).slice(0, 2000)}

CLINICIAN NOTE:
${doctorThought}

Generate each report now.`

  const raw = await runNewGemini(
    CLINICAL_DOC_MODEL,
    system,
    user,
    false,
    0,
    false,
    0.3,
    4096,
  )
  const parsed = extractJsonObject(raw)
  const rawReports = Array.isArray(parsed.reports) ? parsed.reports : []

  const reports = rawReports.map((entry, i) => {
    const testType = String(
      (entry as Record<string, unknown>)?.type ?? requested[i] ?? "",
    )
    const structured = normalizeStructuredTestReport(
      entry as Record<string, unknown>,
      testType,
    )
    return {
      type: structured.type,
      reportCategory: structured.category,
      header: structured.header,
      summary: structured.summary,
      findings: structured.findings,
      impression: structured.impression,
      recommendations: structured.recommendations,
      labResults: structured.labResults,
      sections: structured.sections,
      structured,
      fullReport: structured.fullReportMarkdown,
      reportContent: structured.fullReportMarkdown,
    }
  })

  return { success: true, reports }
}

export async function handleNurseReport(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const medicalCase = (body.medicalCase as Record<string, unknown>) || {}
  const symptoms = Array.isArray(medicalCase.symptoms) ? (medicalCase.symptoms as string[]) : []
  const system = `You are an experienced RN documenting an initial nursing assessment for medical student training.
Return ONLY JSON with keys:
chiefComplaint (string, one line),
clinicalNotes (string),
initialAssessment (string),
practiceGuidelines (string),
vitalSigns (object with bloodPressure string, heartRate number, temperature string, respiratoryRate number, oxygenSaturation number).
Values must be consistent with the case.`

  const user = `Case: ${JSON.stringify({
    title: medicalCase.title,
    disease: medicalCase.disease,
    specialty: medicalCase.specialty,
    symptoms,
    history: medicalCase.history,
    patientProfile: medicalCase.patientProfile,
    description: medicalCase.description,
  })}`

  const raw = await runNewGemini(GEMINI_TURN_MODEL, system, user, false, 0, false, 0.45, 1536)
  return extractJsonObject(raw)
}

export async function handleDoctorQuestionExplanation(body: Record<string, unknown>): Promise<{
  explanation: string
}> {
  const question = String(body.question || "")
  const context = (body.context as Record<string, unknown>) || {}
  const conversation = Array.isArray(body.conversation) ? body.conversation : []
  const symptoms = Array.isArray(context.symptoms) ? (context.symptoms as string[]) : []
  const patientProfile = (context.patientProfile as Record<string, unknown>) || {}
  const conv = conversation.map((m: any) => `${m.role}: ${m.content}`).join("\n")

  const system = `You are an attending teaching medical students in shadow mode.
Return ONLY JSON: {"explanation":string} — one concise sentence on why this question advances diagnosis or safety.`

  const user = `Question: ${question}
Symptoms: ${symptoms.join(", ")}
Patient: ${JSON.stringify(patientProfile)}
Transcript:
${conv || "(empty)"}`

  const raw = await runNewGemini(GEMINI_TURN_MODEL, system, user, false, 0, false, 0.35, 512)
  try {
    const parsed = extractJsonObject(raw)
    const explanation = String(parsed.explanation ?? "").trim()
    if (explanation) return { explanation }
  } catch {
    // model sometimes returns plain prose instead of JSON
  }
  const fallback = stripMarkdownJsonFence(raw)
    .replace(/^\{?\s*"?explanation"?\s*:\s*"?/i, "")
    .replace(/"?\s*\}?\s*$/i, "")
    .trim()
  return {
    explanation: fallback || "This question helps clarify the presentation and narrow the differential.",
  }
}

export async function handleAskDoctor(body: Record<string, unknown>): Promise<{ response: string }> {
  const question = String(body.question || "")
  const conversation = Array.isArray(body.conversation) ? body.conversation : []
  const context = (body.context as Record<string, unknown>) || {}
  const conv = conversation.map((m: any) => `${m.role}: ${m.content}`).join("\n")

  const system = `You are a supportive clinical educator answering a student's question during a simulated encounter.
Respond in clear prose (not JSON). 2–4 short paragraphs max. No diagnosis "reveals" beyond what is clinically justified from the transcript.`

  const user = `Student question: ${question}
Context: ${JSON.stringify(context).slice(0, 2500)}
Transcript:
${conv || "(empty)"}`

  const text = await runNewGemini(GEMINI_TURN_MODEL, system, user, false, 0, true, 0.45, 1536)
  return { response: text.trim() }
}

export async function handleGenerateSoapNote(body: Record<string, unknown>): Promise<{
  success: boolean
  soapNote: string
}> {
  const patientInfo = (body.patientInfo as Record<string, unknown>) || {}
  const conversation = Array.isArray(body.conversation) ? body.conversation : []
  const doctorThoughts = Array.isArray(body.doctorThoughts) ? body.doctorThoughts : []
  const differentialDiagnosis = Array.isArray(body.differentialDiagnosis) ? body.differentialDiagnosis : []
  const currentCase = (body.currentCase as Record<string, unknown>) || {}
  const reports = Array.isArray(body.reports) ? body.reports : []

  const conversationText = conversation
    .map((msg: any) => {
      const role =
        msg.role === "doctor"
          ? "Doctor"
          : msg.role === "student"
            ? "Student"
            : msg.role === "patient"
              ? "Patient"
              : String(msg.role || "Speaker")
      return `${role}: ${msg.content}`
    })
    .join("\n")

  const thoughtsSummary =
    doctorThoughts.map((t: any) => `- ${t.thought || t}`).join("\n") || "No documented thoughts."

  const ddxSummary =
    differentialDiagnosis
      .map((dx: any) => {
        const prob = typeof dx.probability === "number" ? dx.probability : 0
        const pct = prob > 1 ? prob : Math.round(prob * 100)
        return `- ${dx.condition}: ${pct}% — ${dx.reason || dx.reasoning || "per interview"}`
      })
      .join("\n") || "No differential documented."

  const reportsSummary =
    reports.length > 0
      ? reports
          .map(
            (r: any) =>
              `- ${r.type}: ${String(r.impression || r.summary || "").slice(0, 500)}`,
          )
          .join("\n")
      : "No completed diagnostic reports in chart yet."

  const vitals = patientInfo.vitals as Record<string, unknown> | undefined
  const vitalsLine =
    vitals && Object.keys(vitals).length > 0
      ? Object.entries(vitals)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ")
      : "Not documented — state 'Vitals not obtained' in OBJECTIVE if absent from transcript."

  const system = `You are a board-certified attending physician documenting a U.S. hospital-style SOAP note for a medical student simulation.

ACCURACY RULES (mandatory):
- Anchor every statement to the provided transcript, case data, vitals, differentials, and reports. Do not invent history, exam findings, labs, or comorbidities not supported by inputs.
- If data are missing, write "Not documented" or "Not assessed" — never fabricate numeric vitals or test results.
- Use standard medical terminology, lay terms only inside direct patient quotes in SUBJECTIVE.
- The working diagnosis must be clinically coherent with the chief complaint, interview, and top differentials.
- PLAN must be actionable, prioritized, and safe (include disposition and return precautions when appropriate).

STRUCTURE — use exactly these markdown headers (bold), with two blank lines between sections:

**SUBJECTIVE:**
- Chief complaint (one line)
- HPI: onset, location, quality, severity, timing, context, modifying factors, associated symptoms (only if in transcript)
- Pertinent positives/negatives from interview
- PMH, medications, allergies, social history — only if mentioned or provided in patient info

**OBJECTIVE:**
- Vital signs (from structured vitals if provided; otherwise from transcript only)
- Physical exam by system (document only findings supported by the case/transcript; use "Not documented" for systems not addressed)
- Available test results (from TESTS section only)

**ASSESSMENT:**
- One paragraph clinical synthesis linking symptoms, exam, and data to your reasoning
- Line must include: Primary diagnosis: <condition> (ICD-10-CM code, e.g. I21.9)
- Brief differential (2–3 alternatives) with one-line rationale each
- Risk stratification or severity statement when relevant

**PLAN:**
Use bullet lists under these subheadings (plain text labels, not bold):
Diagnostics: — numbered list; use standard test names (e.g., "ECG", "Troponin I", "Chest X-ray") suitable for downstream ordering
Therapeutics: — acute treatments with drug, dose, route, frequency when appropriate
Monitoring: — inpatient/observation needs, serial exams, telemetry, etc.
Patient education: — 2–4 brief points
Follow-up: — timing and specialty
Return precautions / red flags: — when to seek emergency care

Output markdown only. No JSON, no code fences, no preamble.`

  const user = `CASE CONTEXT:
${buildCaseContextBlock(currentCase)}

PATIENT DEMOGRAPHICS:
Name: ${patientInfo.name || "Patient"}
Age: ${patientInfo.age || "Unknown"} | Gender: ${patientInfo.gender || "Unknown"}
Occupation: ${patientInfo.occupation || "Not specified"}
Allergies: ${patientInfo.allergies || "NKDA"}
PMH (if provided): ${patientInfo.medicalHistory || "See transcript"}

VITALS (structured):
${vitalsLine}

INTERVIEW TRANSCRIPT:
${conversationText || "No transcript."}

CLINICIAN REASONING NOTES:
${thoughtsSummary}

DIFFERENTIAL FROM SESSION:
${ddxSummary}

COMPLETED TESTS / REPORTS:
${reportsSummary}

Write the complete SOAP note now.`

  const soapNote = await runNewGemini(
    CLINICAL_DOC_MODEL,
    system,
    user,
    false,
    0,
    true,
    0.35,
    8192,
  )
  return { success: true, soapNote: soapNote.trim() }
}

export async function handleGeneratePrescription(body: Record<string, unknown>): Promise<{
  prescription: string
}> {
  const patientInfo = (body.patientInfo as Record<string, unknown>) || {}
  const currentCase = (body.currentCase as Record<string, unknown>) || {}
  const soapNote = String(body.soapNote || "").slice(0, 8000)
  const diagnosis = String(body.diagnosis || "").trim()
  const reports = Array.isArray(body.reports) ? body.reports : []

  const reportsSummary =
    reports.length > 0
      ? reports
          .map((r: any) => `- ${r.type}: ${String(r.impression || r.summary || "").slice(0, 300)}`)
          .join("\n")
      : "None attached."

  const system = `You are a licensed physician writing an educational discharge / outpatient prescription and treatment summary. The document must be medically coherent with the SOAP note and safe for teaching.

ACCURACY RULES (mandatory):
- Medications must match the working diagnosis and PLAN in the SOAP — do not prescribe unrelated drug classes.
- Respect documented allergies (if NKDA, still note allergy review). Contraindicate clearly if a standard drug is withheld.
- Provide generic drug names; include dose, route, frequency, and duration for each medication.
- Use weight-based or age-appropriate dosing when weight/age are known; if weight unknown, use typical adult doses and note "adjust for weight".
- For acute serious presentations (e.g., chest pain, ACS, sepsis), disposition must reflect urgency (ED, admission, cardiology) — not routine outpatient follow-up only.
- Do not invent lab values or imaging results not in the SOAP.
- Educational simulation only — still follow evidence-based standards.

FORMAT — markdown with these **bold** section headers (two blank lines between sections):

**PATIENT INFORMATION**
Name, age, sex, weight (if known), allergies

**DIAGNOSIS**
Primary diagnosis (match SOAP Primary diagnosis line) with ICD-10 code

**MEDICATIONS**
Numbered list. Each entry:
1. Drug name — dose, route, frequency, duration | Indication: brief phrase

**NON-PHARMACOLOGIC MANAGEMENT**
Bullets: activity, diet, monitoring, lifestyle

**FOLLOW-UP**
Timing, specialty referrals, pending tests

**FURTHER INVESTIGATIONS**
Bullets: tests still needed or pending from SOAP PLAN (use standard names: ECG, Troponin, etc.)

**RETURN PRECAUTIONS / RED FLAGS**
When to call 911 or return immediately

Output markdown only. No JSON, no code fences.`

  const user = `CASE CONTEXT:
${buildCaseContextBlock(currentCase)}

WORKING DIAGNOSIS (from SOAP): ${diagnosis || "See SOAP assessment"}

PATIENT:
Name: ${patientInfo.name || "Patient"}
Age: ${patientInfo.age || "Unknown"} | Gender: ${patientInfo.gender || "Unknown"}
Weight: ${patientInfo.weight || "Not specified"}
Allergies: ${patientInfo.allergies || "NKDA"}

COMPLETED REPORTS:
${reportsSummary}

FULL SOAP NOTE:
${soapNote || "(none)"}

Write the prescription / treatment document now. Align medications and disposition with the SOAP assessment and acuity.`

  const text = await runNewGemini(
    CLINICAL_DOC_MODEL,
    system,
    user,
    false,
    0,
    true,
    0.35,
    4096,
  )
  return { prescription: text.trim() }
}

export async function handleFollowUpGreeting(body: Record<string, unknown>): Promise<{ greeting: string }> {
  const patientInfo = (body.patientInfo as Record<string, unknown>) || {}
  const daysSince = Number(body.daysSinceLastVisit ?? 7)
  const soapNote = String(body.soapNote || "").slice(0, 2000)
  const prescription = String(body.prescription || "").slice(0, 1500)
  const previousDiagnosis = String(body.previousDiagnosis || "")
  const reports = Array.isArray(body.reports) ? body.reports : []
  const reportsSummary =
    reports.length > 0
      ? reports.map((r: any) => `- ${r.type}: ${r.summary || r.impression || ""}`).join("\n")
      : "No new labs documented."

  const system = `You are the same physician in follow-up. Write a brief in-character opening (2–4 sentences) welcoming the patient back, referencing prior plan at a high level, and inviting an update.
Output prose only, no JSON.`

  const user = `Days since last visit: ${daysSince}
Patient: ${JSON.stringify(patientInfo)}
Prior diagnosis label: ${previousDiagnosis}
Recent tests summary:
${reportsSummary}
Prescription summary (truncated): ${prescription.slice(0, 400)}
SOAP excerpt: ${soapNote.slice(0, 800)}`

  const text = await runNewGemini(GEMINI_TURN_MODEL, system, user, false, 0, true, 0.45, 512)
  return { greeting: text.trim() }
}

export async function handleAiSupervisor(body: Record<string, unknown>): Promise<{
  evaluation: {
    content: string
    confidence: number
    shouldIntervene: boolean
    interventionReason?: string
  }
}> {
  const question = String(body.question || "")
  const role = String(body.role || "doctor")
  const context = (body.context as Record<string, unknown>) || {}
  const history = Array.isArray(context.conversationHistory) ? context.conversationHistory : []
  const conv = history.map((m: any) => `${m.role}: ${m.content}`).join("\n")

  const system = `You supervise a ${role === "student" ? "student" : "simulated physician"} in a clinical teaching encounter.
You do NOT know the ground-truth diagnosis label.
Return ONLY JSON: {"shouldIntervene":boolean,"interventionReason":string|null,"content":string,"confidence":number}

Rules:
- Evaluate ONLY the single "Question to evaluate" — earlier transcript lines are context, not separate violations.
- shouldIntervene: true only if THAT question is clearly irrelevant, unsafe, or unprofessional. Do NOT intervene because someone else asked something inappropriate earlier.
- interventionReason: one sentence on what is wrong with THAT question (null if shouldIntervene is false).
- content: 1–2 sentences of actionable coaching (what to ask instead or how to refocus). Never quote, list, or concatenate prior messages or the flagged question.
- Plain text only in content and interventionReason — no HTML entities or markdown.
- Be lenient for normal history and ROS questions.`

  const user = `Role of speaker being evaluated: ${role}

Question to evaluate (judge only this):
${question}

Transcript (context only):
${conv || "(empty)"}

Case hints (non-diagnostic): symptoms ${JSON.stringify(context.symptoms || []).slice(0, 400)}`

  const raw = await runNewGemini(GEMINI_TURN_MODEL, system, user, false, 0, false, 0.2, 512)
  const parsed = extractJsonObject(raw)
  const shouldIntervene = Boolean(parsed.shouldIntervene)
  const interventionReason =
    parsed.interventionReason == null ? undefined : String(parsed.interventionReason)
  return {
    evaluation: {
      content: String(parsed.content || "").trim() || "Continue.",
      confidence: Number(parsed.confidence ?? 0.75),
      shouldIntervene,
      interventionReason: shouldIntervene ? interventionReason || "Supervisor flag" : undefined,
    },
  }
}
