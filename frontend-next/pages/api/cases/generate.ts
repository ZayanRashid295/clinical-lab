import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { caseGenerationService } from "@/lib/fyp/case-generation-service";
import type { MedicalCase } from "@/lib/fyp/data-models";
import { BEST_GEMINI_MODEL, runNewGemini } from "@/lib/fyp/llm-gemini";

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
    /^(?:GOOGLE_API_KEY|GEMINI_API_KEY)\s*=\s*("?)(.*?)\1\s*$/m
  );
  if (!geminiKeyMatch?.[2]) {
    return;
  }

  process.env.GOOGLE_API_KEY = geminiKeyMatch[2];
}

async function generateCasesWithGemini(
  count: number,
  specialty?: string,
  difficulty?: "beginner" | "intermediate" | "advanced",
  forceRare?: boolean,
  caseType?: "emergency" | "outpatient" | "chronic",
): Promise<MedicalCase[]> {
  hydrateGeminiApiKeyFromBackendEnv();

  const schemaPrompt = `Return ONLY strict JSON as:
{"cases":[{"title":"...","description":"...","difficulty":"beginner|intermediate|advanced","disease":"...","diseaseName":"...","specialty":"...","isRare":true|false,"symptoms":["..."],"history":["..."],"labs":{"k":"v"},"expectedQuestions":["..."],"patientProfile":{"name":"...","age":35,"gender":"Male|Female","occupation":"..."} }]}
Do not include markdown fences.`;
  const constraints = `Generate ${count} medically coherent case(s).
specialty=${specialty || "any"}
difficulty=${difficulty || "intermediate"}
forceRare=${Boolean(forceRare)}
caseType=${caseType || "outpatient"}
Keep data realistic and concise.`;
  const text = await runNewGemini(BEST_GEMINI_MODEL, schemaPrompt, constraints, false, 0, false);
  const parsed = JSON.parse(text);
  if (!parsed?.cases || !Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    throw new Error("Gemini did not return valid cases.");
  }
  return parsed.cases.slice(0, count).map((c: Omit<MedicalCase, "id" | "createdAt">) => ({
    ...c,
    id: randomId(),
    createdAt: new Date().toISOString(),
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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
      } = body as {
        count?: number;
        specialty?: string;
        difficulty?: "beginner" | "intermediate" | "advanced";
        forceRare?: boolean;
        rareProbability?: number;
        caseType?: "emergency" | "outpatient" | "chronic";
        useLLM?: boolean;
      };

      const cases = useLLM
        ? await generateCasesWithGemini(count, specialty, difficulty, forceRare, caseType)
        : caseGenerationService.generateCases(count, {
            specialty,
            difficulty,
            forceRare,
            rareProbability,
            caseType,
          });

      return res.status(200).json({
        cases,
        source: useLLM ? "llm" : "rule-based",
      });
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
      const count = parseInt((req.query.count as string) || "1");
      const specialty = (req.query.specialty as string) || undefined;
      const difficulty =
        (req.query.difficulty as "beginner" | "intermediate" | "advanced") ||
        undefined;
      const forceRare = req.query.forceRare === "true";
      const rareProbability = parseFloat(
        (req.query.rareProbability as string) || "0.08"
      );
      const caseType =
        (req.query.caseType as "emergency" | "outpatient" | "chronic") ||
        undefined;

      const cases = caseGenerationService.generateCases(count, {
        specialty,
        difficulty,
        forceRare,
        rareProbability,
        caseType,
      });

      return res.status(200).json({ cases });
    } catch (error) {
      console.error("Error generating cases:", error);
      return res.status(500).json({ error: "Failed to generate cases" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
