"use server";

import { put } from "@vercel/blob";
import { inspoUploadEnabled } from "@/lib/inspo";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/** Store one client reference photo. The browser downsizes it before sending. */
export async function uploadInspoPhoto(formData: FormData): Promise<UploadResult> {
  if (!inspoUploadEnabled()) return { ok: false, error: "UPLOAD_DISABLED" };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "NO_FILE" };
  if (!ALLOWED.has(file.type)) return { ok: false, error: "BAD_TYPE" };
  if (file.size > MAX_BYTES) return { ok: false, error: "TOO_LARGE" };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  try {
    const blob = await put(`inspo/${Date.now()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return { ok: true, url: blob.url };
  } catch (err) {
    console.error("[inspo] upload failed", err);
    return { ok: false, error: "UPLOAD_FAILED" };
  }
}
