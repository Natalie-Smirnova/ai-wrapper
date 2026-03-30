import { createBrowserClient } from "@/lib/auth/supabase-auth";

const supabase = createBrowserClient();

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }

  return {};
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body?.error?.message || `API error: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

export async function apiStream(
  path: string,
  body: unknown
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(
      errBody?.error?.message || `API error: ${res.status} ${res.statusText}`
    );
  }

  return res.body!.getReader();
}

export { supabase };
