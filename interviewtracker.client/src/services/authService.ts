import type {
    AuthResponse,
    LoginRequest,
    RegisteredUser,
    RegisterRequest,
  } from "../types/auth";
  
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5253";
  const storageKey = "interviewTrackerAuth";
  
  export async function login(
    request: LoginRequest
  ): Promise<AuthResponse> {
    const response = await fetch(`${apiBaseUrl}/api/Auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid email or password.");
      }
  
      throw new Error(`Login failed. Status: ${response.status}`);
    }
  
    const auth: AuthResponse = await response.json();
  
    // setItem overwrites the previous user's session.
    localStorage.setItem("interviewTrackerAuth",JSON.stringify(auth));
  
    return auth;
  }
  
  export function getStoredAuth(): AuthResponse | null {
    const storedValue = localStorage.getItem(storageKey);
  
    if (!storedValue) {
      return null;
    }
  
    try {
      const auth = JSON.parse(storedValue) as AuthResponse;
  
      if (new Date(auth.expiresAt) <= new Date()) {
        localStorage.removeItem(storageKey);
        return null;
      }
  
      return auth;
    } catch {
      localStorage.removeItem(storageKey);
      return null;
    }
  }
  
  export function getAccessToken(): string | null {
    return getStoredAuth()?.accessToken ?? null;
  }
  
  export function logout(): void {
    localStorage.removeItem(storageKey);
  }

  export async function register(
    request: RegisterRequest
  ): Promise<RegisteredUser> {
    const response = await fetch(`${apiBaseUrl}/api/Auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
  
      const message =
        errorBody?.errors?.join(", ") ||
        errorBody?.message ||
        `Registration failed. Status: ${response.status}`;
  
      throw new Error(message);
    }
  
    return response.json();
  }
