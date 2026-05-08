const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:43817";

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
        console.error(
          `API request failed with status ${response.status}:`,
          errorData
        );
        
        // Handle 401 Unauthorized - clear invalid token
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
            console.log("🔒 Cleared invalid auth token due to 401 error");
          }
        }
        
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
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
        throw new Error(`Invalid JSON response from server: ${errorMessage}`);
      }
    } catch (error) {
      console.error("API request failed:", error);
      // If it's a network error (like connection refused), provide a more helpful message
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          `Unable to connect to API server at ${url}. Please ensure the backend is running.`
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
