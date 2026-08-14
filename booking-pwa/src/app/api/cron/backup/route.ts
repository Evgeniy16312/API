import { createSqliteBackup, listRecentBackups } from "@/lib/backup";
import { jsonError, jsonOk } from "@/lib/http";

function authorize(request: Request): boolean {
  const key =
    request.headers.get("x-admin-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected =
    process.env.CRON_SECRET || process.env.ADMIN_SETUP_KEY || "";
  return Boolean(expected && key === expected);
}

/** Daily SQLite backup into data/backups (volume). */
export async function POST(request: Request) {
  if (!authorize(request)) return jsonError("Forbidden", 403);

  try {
    const result = createSqliteBackup();
    return jsonOk({
      ...result,
      recent: listRecentBackups(5),
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return jsonError(
      error instanceof Error ? error.message : "Ошибка бэкапа",
      500
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
