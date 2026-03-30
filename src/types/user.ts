export interface User {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnonymousSession {
  id: string;
  session_token: string;
  questions_used: number;
  created_at: string;
}

export interface AuthMeResponse {
  authenticated: boolean;
  user: User | null;
  anonymous: boolean;
  questions_used: number;
  questions_limit: number;
}
