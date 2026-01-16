import { BaseApiService } from "../../app/services/base/base-api.service";

export class AuthService extends BaseApiService {
  async login(email: string, password: string): Promise<any> {
    const url = `${this.baseURL}/auth/login`;
    const config: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    };

    return new Promise(async (resolve, reject) => {
      try {
        console.log(`Making login request to: ${url}`);
        const response = await fetch(url, config);

        let responseData;
        try {
          responseData = await response.json();
        } catch (parseError) {
          responseData = {};
        }

        if (!response.ok) {
          // For authentication endpoints, we want to handle 401 errors gracefully
          // and return the error message from the backend
          console.error(
            `Login failed with status ${response.status}:`,
            responseData
          );

          const errorMessage =
            responseData.message || `Authentication failed: ${response.status}`;
          console.log(`🚫 Rejecting with error: ${errorMessage}`);
          reject(new Error(errorMessage));
          return;
        }

        console.log(`✅ Login successful, resolving with data:`, responseData);

        // Store auth token in localStorage
        if (responseData.access_token) {
          localStorage.setItem("authToken", responseData.access_token);
        }

        // Fetch complete user profile with roles and permissions
        try {
          const profileResponse = await this.getProfile();
          console.log(`✅ Profile fetched with roles:`, profileResponse);

          // Extract roles and permissions from JWT token if available
          let jwtRoles: string[] = [];
          let jwtPermissions: string[] = [];
          
          if (responseData.access_token) {
            try {
              const { decodeJWT } = await import("../utils/jwt-decoder");
              const decoded = decodeJWT(responseData.access_token);
              jwtRoles = decoded?.roles || [];
              jwtPermissions = decoded?.permissions || [];
            } catch (jwtError) {
              console.warn("Could not decode JWT:", jwtError);
            }
          }

          // Transform roles to simple array format
          const rolesFromProfile = profileResponse.roles
            ?.map((userRole: any) => 
              typeof userRole === 'string' ? userRole : userRole.role?.name || userRole.name
            )
            .filter(Boolean) || [];

          // Combine JWT roles with profile roles (JWT takes precedence)
          const allRoles = jwtRoles.length > 0 ? jwtRoles : rolesFromProfile;

          // Extract permissions from profile
          const permissionsFromProfile = profileResponse.permissions
            ?.map((userPerm: any) =>
              typeof userPerm === 'string' ? userPerm : userPerm.permission?.name || userPerm.name
            )
            .filter(Boolean) || [];

          // Combine JWT permissions with profile permissions (JWT takes precedence)
          const allPermissions = jwtPermissions.length > 0 ? jwtPermissions : permissionsFromProfile;

          const userWithAccess = {
            ...profileResponse,
            roles: allRoles,
            permissions: allPermissions,
          };

          localStorage.setItem("userData", JSON.stringify(userWithAccess));
          resolve({ ...responseData, user: userWithAccess });
        } catch (profileError) {
          console.error("Failed to fetch user profile:", profileError);
          // Fallback to basic user data with JWT roles/permissions if available
          let userData = responseData.user || {};
          
          if (responseData.access_token) {
            try {
              const { decodeJWT } = await import("../utils/jwt-decoder");
              const decoded = decodeJWT(responseData.access_token);
              userData = {
                ...userData,
                roles: decoded?.roles || [],
                permissions: decoded?.permissions || [],
              };
            } catch (jwtError) {
              // Ignore JWT decode errors
            }
          }
          
          localStorage.setItem("userData", JSON.stringify(userData));
          resolve({ ...responseData, user: userData });
        }
      } catch (error) {
        console.error("Login request failed:", error);
        // If it's a network error (like connection refused), provide a more helpful message
        if (error instanceof TypeError && error.message.includes("fetch")) {
          reject(
            new Error(
              `Unable to connect to API server at ${url}. Please ensure the backend is running.`
            )
          );
        } else {
          reject(error);
        }
      }
    });
  }

  async register(userData: any): Promise<any> {
    return this.post("/auth/register", userData);
  }

  async getProfile(): Promise<any> {
    return this.get("/auth/profile");
  }

  async logout(): Promise<any> {
    try {
      // Make logout API call first (while we still have the token)
      const result = await this.post("/auth/logout");

      // Clear localStorage data after successful API call
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");

      return result;
    } catch (error) {
      // Even if the API call fails, clear localStorage data
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");

      // Don't throw the error - logout should always succeed locally
      console.warn(
        "Logout API call failed, but local logout completed:",
        error
      );
      return { success: true, message: "Logged out locally" };
    }
  }

  isAuthenticated(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    const token = localStorage.getItem("authToken");
    return !!token;
  }

  getCurrentUser(): any {
    if (typeof window === "undefined") {
      return null;
    }
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
        return null;
      }
    }
    return null;
  }
}

export const authService = new AuthService();
