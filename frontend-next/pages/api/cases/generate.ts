import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { caseGenerationService } from "@/lib/fyp/case-generation-service";
import type { MedicalCase } from "@/lib/fyp/data-models";
import { BEST_GEMINI_MODEL, hasGeminiApiKey, runNewGemini } from "@/lib/fyp/llm-gemini";

function randomId() {
  return Math.random().toString(36).slice(2, 11);
}

function hydrateGeminiApiKeyFromBackendEnv() {
  if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
    return;
  }

  const backendEnvPath = path.resolve(process.cwd(), "../backend/.env");
  if (!fs.existsSync(backendEnvPath)) {
    return;
  }

  const backendEnv = fs.readFileSync(backendEnvPath, "utf8");
  const geminiKeyMatch = backendEnv.match(
    /^(?:GOOGLE_API_KEY|GEMINI_API_KEY)\s*=\s*("?)(.*?)\1\s*$/m,
  );
  if (!geminiKeyMatch?.[2]) {
    return;
  }

  process.env.GOOGLE_API_KEY = geminiKeyMatch[2];
}

function parseLlmJson<T>(text: string): T {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  try {
    return JSON.parse(unfixed) as T;
  } catch {
    const match = unfenced.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Gemini returned invalid JSON for case generation.");
    }
    return JSON.parse(match[0]) as T;
  }
}

function normalizeGeneratedCase(
  raw: Partial<MedicalCase> & { disease?: string },
  fallbackSpecialty?: string,
  fallbackDifficulty: "beginner" | "intermediate" | "advanced" = "intermediate",
): MedicalCase {
  const diseaseName =
    raw.diseaseName?.trim() ||
    raw.disease?.trim() ||
    "Undifferentiated clinical presentation";
  const specialty =
    raw.specialty?.trim() || fallbackSpecialty || "Internal Medicine";
  const difficulty =
    raw.difficulty === "beginner" ||
    raw.difficulty === "advanced" ||
    raw.difficulty === "intermediate"
      ? raw.difficulty
      : fallbackDifficulty;
  const symptoms =
    Array.isArray(raw.symptoms) && raw.symptoms.length > 0
      ? raw.symptoms.map(String)
      : ["fatigue", "progressive symptoms", "decreased functional status"];
  const history =
    Array.isArray(raw.history) && raw.history.length > 0
      ? raw.history.map(String)
      : ["no significant past medical history"];
  const expectedQuestions =
    Array.isArray(raw.expectedQuestions) && raw.expectedQuestions.length > 0
      ? raw.expectedQuestions.map(String)
      : [
          "What brings you in today?",
          "When did your symptoms start?",
          "Any relevant medical history?",
        ];
  const patientProfile = {
    name: raw.patientProfile?.name?.trim() || "Alex Morgan",
    age:
      typeof raw.patientProfile?.age === "number" && raw.patientProfile.age > 0
        ? raw.patientProfile.age
        : 52,
    gender:
      raw.patientProfile?.gender === "Female" ||
      raw.patientProfile?.gender === "Male"
        ? raw.patientProfile.gender
        : "Female",
    occupation:
      raw.patientProfile?.occupation?.trim() || "Office worker",
  };

  return {
    id: randomId(),
    createdAt: new Date().toISOString(),
    title: raw.title?.trim() || `${specialty} Case`,
    description:
      raw.description?.trim() ||
      `A ${patientProfile.age}-year-old ${patientProfile.gender.toLowerCase()} patient presents for evaluation.`,
    difficulty,
    disease: diseaseName,
    diseaseName,
    specialty,
    isRare: Boolean(raw.isRare),
    symptoms,
    history,
    labs:
      raw.labs && typeof raw.labs === "object" && !Array.isArray(raw.labs)
        ? raw.labs
        : { "Basic labs": "pending" },
    expectedQuestions,
    patientProfile,
  };
}

async function generateCasesWithGemini(
  count: number,
  specialty?: string,
  difficulty?: "beginner" | "intermediate" | "advanced",
  forceRare?: boolean,
  caseType?: "emergency" | "outpatient" | "chronic",
): Promise<MedicalCase[]> {
  hydrateGeminiApiKeyFromBackendEnv();

  if (!hasGeminiApiKey()) {
    throw new Error("Gemini API key is not configured.");
  }

  const specialtyLine = specialty?.trim()
    ? `The case MUST be appropriate for specialty "${specialty}" (diagnosis and presentation fit that field).`
    : "Choose any clinically appropriate specialty.";

  const schemaPrompt = `You are a medical case author for clinical education.
Return ONLY strict JSON (no markdown) as:
{"cases":[{"title":"...","description":"...","difficulty":"beginner|intermediate|advanced","disease":"...","diseaseName":"...","specialty":"...","isRare":true|false,"symptoms":["..."],"history":["..."],"labs":{"k":"v"},"expectedQuestions":["..."],"patientProfile":{"name":"...","age":35,"gender":"Male|Female","occupation":"..."}}]}
${specialtyLine}
diseaseName is the ground-truth diagnosis (hidden from the student during the encounter).`;
  const constraints = `Generate exactly ${count} medically coherent, internally consistent case(s).
specialty=${specialty?.trim() || "any"}
difficulty=${difficulty || "intermediate"}
forceRare=${Boolean(forceRare)}
caseType=${caseType || "outpatient"}
Use realistic symptoms, history, labs, and 5+ expectedQuestions.`;

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await runNewGemini(
        BEST_GEMINI_MODEL,
        schemaPrompt,
        constraints,
        false,
        0,
        false,
      );
      const parsed = parseLlmJson<{ cases?: Partial<MedicalCase>[] }>(text);
      if (!parsed?.cases || !Array.isArray(parsed.cases) || parsed.cases.length === 0) {
        throw new Error("Gemini did not return valid cases.");
      }
      return parsed.cases
        .slice(0, count)
        .map((c) => normalizeGeneratedCase(c, specialty, difficulty));
    } catch (err) {
      lastError = err;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini case generation failed after retries.");
}

type GenerationBody = {
  count?: number;
  specialty?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  forceRare?: boolean;
  rareProbability?: number;
  caseType?: "emergency" | "outpatient" | "chronic";
  useLLM?: boolean;
};

function generateRuleBasedCases(
  count: number,
  body: GenerationBody,
): MedicalCase[] {
  const options = {
    specialty: body.specialty,
    difficulty: body.difficulty,
    forceRare: body.forceRare,
    rareProbability: body.rareProbability,
    caseType: body.caseType,
  };
  try {
    return caseGenerationService.generateCases(count, options);
  } catch (err) {
    if (!body.specialty) throw err;
    return caseGenerationService.generateCases(count, {
      ...options,
      specialty: undefined,
    });
  }
}

async function resolveCases(
  body: GenerationBody,
): Promise<{ cases: MedicalCase[]; source: string }> {
  const count = body.count ?? 1;
  const preferLlm = body.useLLM !== false;

  if (preferLlm) {
    try {
      const cases = await generateCasesWithGemini(
        count,
        body.specialty,
        body.difficulty,
        body.forceRare,
        body.caseType,
      );
      return { cases, source: "llm" };
    } catch (llmError) {
      console.warn("[cases/generate] LLM failed, using rule-based fallback:", llmError);
    }
  }

  const cases = generateRuleBasedCases(count, body);
  return { cases, source: preferLlm ? "rule-based-fallback" : "rule-based" };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    try {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const {
        count = 1,
        specialty,
        difficulty,
        forceRare,
        rareProbability,
        caseType,
        useLLM = true,
      } = body as GenerationBody;

      const { cases, source } = await resolveCases({
        count,
        specialty,
        difficulty,
        forceRare,
        rareProbability,
        caseType,
        useLLM,
      });

      return res.status(200).json({ cases, source });
    } catch (error) {
      console.error("Error generating cases:", error);
      return res.status(500).json({
        error: "Failed to generate cases",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (req.method === "GET") {
    try {
      const count = parseInt((req.query.count as string) || "1", 10);
      const specialty = (req.query.specialty as string) || undefined;
      const difficulty =
        (req.query.difficulty as "beginner" | "intermediate" | "advanced") ||
        undefined;
      const forceRare = req.query.forceRare === "true";
      const rareProbability = parseFloat(
        (req.query.rareProbability as string) || "0.08",
      );
      const caseType =
        (req.query.caseType as "emergency" | "outpatient" | "chronic") ||
        undefined;
      const useLLM = req.query.useLLM !== "false";

      const { cases, source } = await resolveCases({
        count,
        specialty,
        difficulty,
        forceRare,
        rareProbability,
        caseType,
        useLLM,
      });

      return res.status(200).json({ cases, source });
    } catch (error) {
      console.error("Error generating cases:", error);
      return res.status(500).json({ error: "Failed to generate cases" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
