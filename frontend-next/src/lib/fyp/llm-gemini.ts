import { GoogleGenerativeAI } from "@google/generative-ai";

export const BEST_GEMINI_MODEL = "gemini-2.5-flash";

function resolveGeminiApiKey(): string | undefined {
  return (
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY
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
  return runNewGemini(modelName, instructions, prompt);
}

export async function runNewGemini(
  modelName: string,
  instructions: string,
  prompt: string,
  thinkingMode = true,
  thinkingBudget = 0,
  isFromChatbot = false,
  temperature?: number,
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
