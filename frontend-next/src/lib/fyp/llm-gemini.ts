import { GoogleGenerativeAI } from "@google/generative-ai";

export const BEST_GEMINI_MODEL = "gemini-2.5-flash";

/** Lighter model for interactive turns; override with MEDPREP_GEMINI_TURN_MODEL or GEMINI_TURN_MODEL. */
export const GEMINI_TURN_MODEL =
  process.env.MEDPREP_GEMINI_TURN_MODEL?.trim() ||
  process.env.GEMINI_TURN_MODEL?.trim() ||
  "gemini-2.5-flash-lite";

function normalizeApiKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^["']+|["']+$/g, "");
}

function resolveGeminiApiKey(): string | undefined {
  return normalizeApiKey(
    process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  );
}

export function hasGeminiApiKey(): boolean {
  return Boolean(resolveGeminiApiKey());
}

export function getGemini() {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Set GOOGLE_API_KEY or GEMINI_API_KEY (server-side preferred)."
    );
  }

  const vendor = new GoogleGenerativeAI(apiKey);
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ];
  return { vendor, models };
}

export async function runGemini(
  genAI: { vendor: GoogleGenerativeAI; models: string[] },
  modelNo: number,
  instructions: string,
  prompt: string,
): Promise<string> {
  const modelName = genAI.models[modelNo];
  if (!modelName) {
    throw new Error(`Invalid Gemini model index: ${modelNo}`);
  }
  return runNewGemini(modelName, instructions, prompt, false, 0, true);
}

function isGeminiRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  if (
    status === 403 ||
    status === 404 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }
  return /403|404|forbidden|not found|permission|503|429|500|502|504|unavailable|high demand|overloaded|resource exhausted|rate limit/i.test(
    msg,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function geminiModelFallbackChain(primary: string): string[] {
  const chain = [
    primary,
    GEMINI_TURN_MODEL,
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];
  return chain.filter((m, i) => chain.indexOf(m) === i);
}

/** True when every model in the chain rejected the key (billing, API disabled, restrictions). */
export function isGeminiPermissionOrAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  return (
    status === 403 ||
    status === 401 ||
    /403|401|forbidden|permission|api key|invalid.*key|API_KEY_INVALID/i.test(msg)
  );
}

async function runNewGeminiOnce(
  modelName: string,
  instructions: string,
  prompt: string,
  thinkingMode: boolean,
  thinkingBudget: number,
  isFromChatbot: boolean,
  temperature?: number,
  maxOutputTokens?: number,
): Promise<string> {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Set GOOGLE_API_KEY or GEMINI_API_KEY (server-side preferred)."
    );
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const generationConfig: Record<string, unknown> = {};
  if (typeof temperature === "number" && !Number.isNaN(temperature)) {
    generationConfig.temperature = temperature;
  }

  if (!thinkingMode) {
    generationConfig.topP = 0.9;
    generationConfig.topK = 40;
    generationConfig.thinkingConfig = { thinkingBudget };
    generationConfig.responseMimeType = isFromChatbot ? "text/plain" : "application/json";
    if (typeof maxOutputTokens === "number" && maxOutputTokens > 0) {
      generationConfig.maxOutputTokens = maxOutputTokens;
    }
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig,
  });

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: instructions }] },
      { role: "model", parts: [{ text: "Understood. Awaiting your input." }] },
    ],
  });

  const result = await chat.sendMessage(prompt);
  const text = result.response.text();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}

export async function runNewGemini(
  modelName: string,
  instructions: string,
  prompt: string,
  thinkingMode = true,
  thinkingBudget = 0,
  isFromChatbot = false,
  temperature?: number,
  maxOutputTokens?: number,
): Promise<string> {
  const models = geminiModelFallbackChain(modelName);
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await runNewGeminiOnce(
          model,
          instructions,
          prompt,
          thinkingMode,
          thinkingBudget,
          isFromChatbot,
          temperature,
          maxOutputTokens,
        );
      } catch (err) {
        lastError = err;
        if (!isGeminiRetryableError(err)) throw err;
        await sleep(350 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini request failed after retries");
}

export async function* runNewGeminiStreaming(
  modelName: string,
  instructions: string,
  prompt: string,
  thinkingMode = true,
  thinkingBudget = 0,
  isFromChatbot = false,
  temperature?: number,
): AsyncGenerator<string, void, unknown> {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Set GOOGLE_API_KEY or GEMINI_API_KEY (server-side preferred)."
    );
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const generationConfig: Record<string, unknown> = {};
  if (typeof temperature === "number" && !Number.isNaN(temperature)) {
    generationConfig.temperature = temperature;
  }

  if (!thinkingMode) {
    generationConfig.topP = 0.9;
    generationConfig.topK = 40;
    generationConfig.thinkingConfig = { thinkingBudget };
    generationConfig.responseMimeType = isFromChatbot ? "text/plain" : "application/json";
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig,
  });

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: instructions }] },
      { role: "model", parts: [{ text: "Understood. Awaiting your input." }] },
    ],
  });

  const result = await chat.sendMessageStream(prompt);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}

export async function runGeminiWithImage(
  genAI: { vendor: GoogleGenerativeAI; models: string[] },
  modelNo: number,
  base64Image: string,
  mimeType: string,
  prompt: string,
  instructions?: string,
): Promise<string> {
  const modelName = genAI.models[modelNo];
  if (!modelName) {
    throw new Error(`Invalid Gemini model index: ${modelNo}`);
  }
  const model = genAI.vendor.getGenerativeModel({ model: modelName });
  const imagePart = { inlineData: { data: base64Image, mimeType } };
  const parts = [{ text: prompt }, imagePart];

  if (instructions) {
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: instructions }] },
        { role: "model", parts: [{ text: "Understood. I can analyze images and text." }] },
      ],
    });
    const result = await chat.sendMessage(parts);
    return result.response.text();
  }

  const result = await model.generateContent(parts);
  return result.response.text();
}
