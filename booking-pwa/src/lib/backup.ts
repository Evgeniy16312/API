import fs from "fs";
import path from "path";
import { getDataDir, getDb, getDbPath } from "@/lib/db";

export type BackupResult = {
  ok: true;
  file: string;
  path: string;
  bytes: number;
  kept: number;
  pruned: number;
};

function backupDir(): string {
  const dir = path.join(getDataDir(), "backups");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function keepCount(): number {
  const n = Number(process.env.BACKUP_KEEP || "14");
  if (!Number.isFinite(n) || n < 1) return 14;
  return Math.min(90, Math.floor(n));
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const ms = String(d.getUTCMilliseconds()).padStart(3, "0");
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}${ms}`
  );
}

function listBackupFiles(): string[] {
  const dir = backupDir();
  return fs
    .readdirSync(dir)
    .filter((f) => /^booking-\d{8}-\d{6,9}\.db$/.test(f))
    .sort();
}

export function pruneOldBackups(keep = keepCount()): {
  kept: number;
  pruned: number;
} {
  const files = listBackupFiles();
  if (files.length <= keep) return { kept: files.length, pruned: 0 };
  const remove = files.slice(0, files.length - keep);
  const dir = backupDir();
  for (const f of remove) {
    try {
      fs.unlinkSync(path.join(dir, f));
    } catch {
      /* ignore */
    }
  }
  return { kept: keep, pruned: remove.length };
}

/**
 * Consistent SQLite snapshot into data/backups/ (same Docker volume).
 * Uses VACUUM INTO when available; falls back to WAL checkpoint + copy.
 */
export function createSqliteBackup(): BackupResult {
  getDb(); // ensure open + schema
  const dir = backupDir();
  const file = `booking-${stamp()}.db`;
  const dest = path.join(dir, file);

  try {
    // Escape single quotes in path for SQL literal
    const sqlPath = dest.replace(/'/g, "''");
    getDb().exec(`VACUUM INTO '${sqlPath}'`);
  } catch (error) {
    console.warn("VACUUM INTO failed, falling back to file copy:", error);
    try {
      getDb().exec("PRAGMA wal_checkpoint(TRUNCATE)");
    } catch {
      /* ignore */
    }
    fs.copyFileSync(getDbPath(), dest);
  }

  const bytes = fs.statSync(dest).size;
  const { kept, pruned } = pruneOldBackups();
  return { ok: true, file, path: dest, bytes, kept, pruned };
}

export function listRecentBackups(limit = 10): {
  file: string;
  bytes: number;
  mtime: string;
}[] {
  const dir = backupDir();
  return listBackupFiles()
    .slice(-limit)
    .reverse()
    .map((file) => {
      const st = fs.statSync(path.join(dir, file));
      return {
        file,
        bytes: st.size,
        mtime: st.mtime.toISOString(),
      };
    });
}
