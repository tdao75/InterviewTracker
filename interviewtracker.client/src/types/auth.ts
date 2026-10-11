export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    accessToken: string;
    expiresAt: string;
    userId: string;
    displayName: string;
    email: string;
  }

  export interface RegisterRequest {
    displayName: string;
    email: string;
    password: string;
  }
  
  export interface RegisteredUser {
    id: string;
    displayName: string;
    email: string;
  }