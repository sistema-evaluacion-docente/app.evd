import { API_URL } from "@/config";

/** The uploads mount lives at the backend root, not under /api/v1. */
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

/** Absolute URL for a file stored under the backend's uploads directory. */
export function uploadedFileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;

  return `${BACKEND_ORIGIN}/${path.replace(/^\/+/, "")}`;
}
