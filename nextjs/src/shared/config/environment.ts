// Environment configuration for Next.js app
export const environment = {
  production: process.env.NODE_ENV === "production",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  appName: "RideShare Pro",
  version: "1.0.0",
};

// Development environment
export const isDevelopment = process.env.NODE_ENV === "development";

// Production environment
export const isProduction = process.env.NODE_ENV === "production";

// API Configuration
export const apiConfig = {
  baseUrl: environment.apiUrl,
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// Feature flags
export const features = {
  enableAnalytics: isProduction,
  enableDebugLogs: isDevelopment,
  enableMockData: isDevelopment && !process.env.NEXT_PUBLIC_USE_REAL_API,
};

export default environment;
