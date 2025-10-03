// Development environment configuration
// Equivalent to Angular's environment.ts

export const environment = {
  production: false,
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
};
