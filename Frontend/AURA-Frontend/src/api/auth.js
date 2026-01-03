// Token storage keys
const ACCESS_TOKEN_KEY = "aura_access_token";
const REFRESH_TOKEN_KEY = "aura_refresh_token";
const EXPIRES_AT_KEY = "aura_expires_at";
const USER_DATA_KEY = "aura_user_data";
const API_BASE_URL = import.meta.env.DEV_BACKEND_URL || "/api/v1";

class AuthAPI {
  constructor() {
    this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const storedExpiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    this.expiresAt = storedExpiresAt ? parseFloat(storedExpiresAt) : null;
    this.userData = this.getStoredUserData();
  }

  getStoredUserData() {
    try {
      const data = localStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  // Save tokens to localStorage
  saveTokens(accessToken, refreshToken, userData, expiresAt) {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      this.accessToken = accessToken;
    }

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      this.refreshToken = refreshToken;
    }

    if (typeof expiresAt === "number") {
      localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
      this.expiresAt = expiresAt;
    }

    if (userData) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      this.userData = userData;
    }
  }

  // Clear tokens (logout)
  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(USER_DATA_KEY);

    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.userData = null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }

  // Get user role
  getUserRole() {
    return this.userData?.role || null;
  }

  // Get user ID
  getUserId() {
    return this.userData?.user_id || null;
  }

  // Get authorization headers
  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  // Login method
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const statusCode = data.status_code;
      const payload = data.data;

      if (statusCode === 200 && payload) {
        const { access_token, refresh_token, user_id, role, expires_at } =
          payload;

        this.saveTokens(
          access_token,
          refresh_token,
          { user_id, role },
          expires_at
        );

        return {
          success: true,
          data: payload,
          status_code: statusCode,
          message: data.message,
        };
      }

      throw new Error(data.message || "Login failed");
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Logout method
  async logout() {
    try {
      if (this.accessToken) {
        await fetch(`${import.meta.env.DEV_BACKEND_URL}/auth/logout`, {
          method: "POST",
          headers: this.getAuthHeaders(),
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearTokens();
    }
  }

  // Refresh token method
  async refreshToken() {
    try {
      if (!this.refreshToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const statusCode = data.status_code;
      const payload = data.data;

      if (statusCode === 200 && payload) {
        const { access_token, expires_at } = payload;
        this.saveTokens(
          access_token,
          this.refreshToken,
          this.userData,
          expires_at
        );
        return true;
      }

      this.clearTokens();
      return false;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  // Generic API request with auth and error handling
  async apiRequest(endpoint, options = {}) {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (this.accessToken) {
        headers["Authorization"] = `Bearer ${this.accessToken}`;
      }

      const now = Date.now() / 1000;
      if (this.expiresAt && now >= this.expiresAt && this.refreshToken) {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          throw new Error("Session expired");
        }
        headers["Authorization"] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401 && this.accessToken && this.refreshToken) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.apiRequest(endpoint, options);
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return {
        success: true,
        data: data.data,
        status_code: data.status_code,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Create and export singleton instance
export const authAPI = new AuthAPI();

// Utility function for making authenticated requests
export const apiRequest = authAPI.apiRequest.bind(authAPI);
