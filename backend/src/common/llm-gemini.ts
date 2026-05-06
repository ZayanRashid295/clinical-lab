import * as dotenv from "dotenv";
import * as path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });
dotenv.config();

export const BEST_GEMINI_MODEL = "gemini-2.5-flash";

export function getGemini() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is missing.");
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

export async function runNewGemini(
  modelName: string,
  instructions: string,
  prompt: string,
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is missing.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: instructions }] },
      { role: "model", parts: [{ text: "Understood. Awaiting your input." }] },
    ],
  });
  const result = await chat.sendMessage(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Gemini returned empty response.");
  return text;
}
