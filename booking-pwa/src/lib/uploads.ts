import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

export const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function uploadContentType(filename: string): string {
  const ext = path.extname(filename).slice(1).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

/** Resolve /uploads/... path segments to an absolute file under UPLOAD_ROOT. */
export function resolveUploadFilePath(segments: string[]): string | null {
  if (segments.length < 3) return null;
  if (segments.some((s) => !s || s === "." || s === ".." || s.includes("\0"))) {
    return null;
  }

  const full = path.resolve(UPLOAD_ROOT, ...segments);
  const root = path.resolve(UPLOAD_ROOT);
  if (!full.startsWith(root + path.sep) && full !== root) return null;
  return full;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Save data-URL or return http(s) URL as-is. Files go to /public/uploads. */
export function persistImageDataUrl(
  masterId: string,
  imageUrl: string,
  kind: "portfolio" | "avatar" | "theme" = "portfolio"
): string {
  if (!imageUrl.startsWith("data:image/")) {
    return imageUrl;
  }

  const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Некорректный формат изображения");
  }

  const mime = match[1];
  const ext =
    mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const buffer = Buffer.from(match[2], "base64");

  // ~2.5MB decoded limit
  if (buffer.length > 2.5 * 1024 * 1024) {
    throw new Error("Фото слишком большое (макс. ~2 МБ)");
  }

  const dir = path.join(UPLOAD_ROOT, masterId, kind);
  ensureDir(dir);
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/uploads/${masterId}/${kind}/${filename}`;
}

export function tryDeleteUpload(imageUrl: string) {
  if (!imageUrl.startsWith("/uploads/")) return;
  const full = path.join(process.cwd(), "public", imageUrl);
  if (full.startsWith(path.join(process.cwd(), "public", "uploads")) && fs.existsSync(full)) {
    fs.unlinkSync(full);
  }
}
