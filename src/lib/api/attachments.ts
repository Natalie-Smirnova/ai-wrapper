import { apiFetch } from "./client";
import type { Attachment } from "@/types/attachment";
import type { ApiResponse } from "@/types/api";

export async function uploadAttachment(
  chatId: string,
  file: File
): Promise<ApiResponse<Attachment>> {
  const formData = new FormData();
  formData.append("file", file);

  const authHeaders: Record<string, string> = {};
  // Get auth from the client module
  const { supabase } = await import("./client");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    authHeaders.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`/api/chats/${chatId}/attachments`, {
    method: "POST",
    headers: authHeaders,
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Upload failed: ${res.status}`);
  }

  return res.json();
}

export async function deleteAttachment(
  chatId: string,
  attachmentId: string
): Promise<void> {
  await apiFetch(`/api/chats/${chatId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
}

export async function getAttachmentUrl(
  attachmentId: string
): Promise<{ data: { url: string } }> {
  return apiFetch(`/api/attachments/${attachmentId}/url`);
}
