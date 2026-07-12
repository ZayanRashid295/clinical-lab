import { ApiHttpError } from "./api-http-error";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/** NestJS often returns `{ message: string | string[] }` — flatten for UI + ApiHttpError. */
function normalizeApiErrorBodyMessage(errorData: unknown, status: number): string {
  if (typeof errorData !== "object" || errorData === null) {
    return `Request failed (${status})`;
  }
  const o = errorData as { message?: unknown; error?: unknown };
  const raw = o.message;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw)) {
    const parts = raw.filter((x): x is string => typeof x === "string");
    if (parts.length) return parts.join(". ");
  }
  if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  return `Request failed (${status})`;
}

/** HTTP statuses that are normal “business rule” outcomes — avoid noisy dev logs. */
const QUIET_HTTP_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429]);

export abstract class BaseApiService {
  protected baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method with common functionality
  protected async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg =
          normalizeApiErrorBodyMessage(errorData, response.status);

        if (!QUIET_HTTP_STATUSES.has(response.status)) {
          console.error(
            `API request failed with status ${response.status}:`,
            errorData
          );
        }

        // Handle 401 Unauthorized - clear invalid token
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
          }
        }

        throw new ApiHttpError(msg, response.status, errorData);
      }

      const text = await response.text();

      // Handle empty responses
      if (!text.trim()) {
        // Empty response received
        return null;
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error(`Failed to parse JSON response from ${url}:`, text);
        const errorMessage =
          parseError instanceof Error
            ? parseError.message
            : "Unknown parsing error";
        throw new ApiHttpError(
          `Invalid JSON response from server: ${errorMessage}`,
          response.status || 500
        );
      }
    } catch (error) {
      if (error instanceof ApiHttpError) {
        throw error;
      }
      console.error("API request failed:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ApiHttpError(
          `Unable to connect to API server. Please ensure the backend is running.`,
          0,
          error
        );
      }
      throw error;
    }
  }

  // Common GET method
  protected async get(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<any> {
    let url = endpoint;
    let hasCacheBuster = false;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        // Filter out internal cache-busting parameters that shouldn't be sent to backend
        if (key === "_t") {
          hasCacheBuster = true;
          return;
        }
        // Filter out other internal parameters that start with underscore
        if (key.startsWith("_")) {
          return;
        }
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    // Use cache control headers for cache-busting instead of query parameters
    const requestOptions: RequestInit = {
      method: "GET",
      cache: hasCacheBuster ? "no-store" : "default",
    };

    return this.request(url, requestOptions);
  }

  // Common POST method
  protected async post(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Common PATCH method
  protected async patch(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Common PUT method
  protected async put(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Common DELETE method
  protected async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: "DELETE" });
  }
}
