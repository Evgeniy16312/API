import fs from "fs";
import path from "path";
import {
  resolveUploadFilePath,
  uploadContentType,
} from "@/lib/uploads";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = resolveUploadFilePath(segments);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return new Response("Не найдено", { status: 404 });
  }

  const body = fs.readFileSync(filePath);
  return new Response(body, {
    headers: {
      "Content-Type": uploadContentType(path.basename(filePath)),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
