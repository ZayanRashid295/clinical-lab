/**
 * Application Configuration
 * Centralized configuration for the application
 */

export const appConfig = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:43817",
    timeout: 10000, // 10 seconds
  },

  // Data Source Configuration
  dataSource: {
    // Set to true to use mock data, false to use backend API
    useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" || false,

    // Fallback to mock data if backend fails
    fallbackToMock: true,
  },

  // Application Information
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "Transportation Portal",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    description: "A comprehensive transportation management platform",
  },

  // Feature Flags
  features: {
    enableAnalytics:
      process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true" || false,
    enableDebugLogs:
      process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === "true" || false,
    enableRealTimeUpdates:
      process.env.NEXT_PUBLIC_ENABLE_REALTIME === "true" || false,
  },

  // Pagination Defaults
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
  },

  // Cache Configuration
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
  },
} as const;

// Helper functions
export const isMockDataEnabled = () => appConfig.dataSource.useMockData;
export const isBackendAvailable = () => !appConfig.dataSource.useMockData;
export const shouldFallbackToMock = () => appConfig.dataSource.fallbackToMock;

// Environment-specific configurations
export const isDevelopment = () => process.env.NODE_ENV === "development";
export const isProduction = () => process.env.NODE_ENV === "production";
export const isTest = () => process.env.NODE_ENV === "test";

// Logging configuration
export const logConfig = {
  level: appConfig.features.enableDebugLogs ? "debug" : "info",
  enableConsole: isDevelopment(),
  enableRemote: isProduction() && appConfig.features.enableAnalytics,
};

export default appConfig;
