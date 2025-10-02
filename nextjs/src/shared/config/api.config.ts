// API Configuration for Next.js app
export const apiConfig = {
  // Backend API URL - update this to match your backend
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",

  // Whether to use real API or mock data
  useRealAPI:
    process.env.NEXT_PUBLIC_USE_REAL_API === "true" ||
    process.env.NODE_ENV === "production",

  // Request timeout in milliseconds
  timeout: 10000,

  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000,

  // Endpoints
  endpoints: {
    auth: {
      login: "/auth/login",
      register: "/auth/register",
      profile: "/auth/profile",
      logout: "/auth/logout",
    },
    users: "/users",
    rides: "/rides",
    payments: "/payments",
    notifications: "/notifications",
    chat: "/chat",
    locations: "/locations",
  },
};

// Development configuration
export const devConfig = {
  enableMockData: !apiConfig.useRealAPI,
  enableDebugLogs: process.env.NODE_ENV === "development",
  enableAnalytics: process.env.NODE_ENV === "production",
};

export default apiConfig;
