import { db } from "@/lib/db/client";

const BUCKET = "attachments";

export async function uploadFile(
  path: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  const { error } = await db.storage.from(BUCKET).upload(path, file, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);
  return path;
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600); // 1 hour

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteFile(path: string): Promise<void> {
  const { error } = await db.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
