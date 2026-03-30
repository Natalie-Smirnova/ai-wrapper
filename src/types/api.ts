export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  cursor: string | null;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface AuthContext {
  userId: string | null;
  anonId: string | null;
  /** Set when a new anonymous session was just created and must be written to the response cookie */
  newSessionToken?: string;
}
