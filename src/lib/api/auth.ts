import { apiFetch } from "./client";
import type { AuthMeResponse } from "@/types/user";
import type { ApiResponse } from "@/types/api";

export async function fetchMe(): Promise<ApiResponse<AuthMeResponse>> {
  return apiFetch("/api/auth/me");
}

export async function registerUser(input: {
  id: string;
  email: string;
  display_name?: string;
}): Promise<ApiResponse<{ id: string }>> {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function claimAnonymousChats(): Promise<
  ApiResponse<{ claimed: number }>
> {
  return apiFetch("/api/auth/claim", {
    method: "POST",
  });
}
