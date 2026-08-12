import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import fs from "fs";
import path from "path";
import { DEFAULT_SCHEDULE } from "./types";

export type SqlParam = SQLInputValue;

/** Typed helpers — node:sqlite returns Record rows; we cast at the boundary. */
export function sqlAll<T>(
  sql: string,
  ...params: SqlParam[]
): T[] {
  return getDb().prepare(sql).all(...params) as unknown as T[];
}

export function sqlGet<T>(
  sql: string,
  ...params: SqlParam[]
): T | undefined {
  return getDb().prepare(sql).get(...params) as unknown as T | undefined;
}

export function sqlRun(sql: string, ...params: SqlParam[]) {
  return getDb().prepare(sql).run(...params);
}


const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "booking.db");

let db: DatabaseSync | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDb(): DatabaseSync {
  if (!db) {
    ensureDataDir();
    db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    initSchema(db);
    ensureMigrations(db);
  }
  return db;
}

/** Run sync work in a SQLite transaction. */
export function withTransaction<T>(fn: (database: DatabaseSync) => T): T {
  const database = getDb();
  database.exec("BEGIN");
  try {
    const result = fn(database);
    database.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      /* ignore rollback errors */
    }
    throw error;
  }
}

function initSchema(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS masters (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      specialty TEXT DEFAULT '',
      address TEXT DEFAULT '',
      lat REAL,
      lng REAL,
      description TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      token TEXT UNIQUE NOT NULL,
      max_user_id TEXT DEFAULT '',
      vk_user_id TEXT DEFAULT '',
      work_schedule TEXT NOT NULL,
      slot_duration INTEGER DEFAULT 60,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 60,
      price INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portfolio (
      id TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      service_duration INTEGER NOT NULL DEFAULT 60,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS max_connect_codes (
      code TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      max_user_id TEXT DEFAULT '',
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vk_connect_codes (
      code TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      vk_user_id TEXT DEFAULT '',
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_outbox (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      recipient TEXT NOT NULL,
      payload TEXT NOT NULL,
      booking_id TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      available_at TEXT NOT NULL,
      last_error TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      sent_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      booking_id TEXT DEFAULT '',
      client_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_master_date ON bookings(master_id, date);
    CREATE INDEX IF NOT EXISTS idx_services_master ON services(master_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_master ON portfolio(master_id);
    CREATE INDEX IF NOT EXISTS idx_max_codes_master ON max_connect_codes(master_id);
    CREATE INDEX IF NOT EXISTS idx_vk_codes_master ON vk_connect_codes(master_id);
    CREATE INDEX IF NOT EXISTS idx_outbox_pending ON notification_outbox(status, available_at);
    CREATE INDEX IF NOT EXISTS idx_reviews_master ON reviews(master_id, status);
  `);
}

function tableColumns(database: DatabaseSync, table: string): Set<string> {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  return new Set(rows.map((r) => r.name));
}

function ensureMigrations(database: DatabaseSync) {
  const bookingCols = tableColumns(database, "bookings");
  if (!bookingCols.has("service_duration")) {
    database.exec(
      "ALTER TABLE bookings ADD COLUMN service_duration INTEGER NOT NULL DEFAULT 60"
    );
  }

  const masterCols = tableColumns(database, "masters");
  if (!masterCols.has("lat")) {
    database.exec("ALTER TABLE masters ADD COLUMN lat REAL");
  }
  if (!masterCols.has("lng")) {
    database.exec("ALTER TABLE masters ADD COLUMN lng REAL");
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS vk_connect_codes (
      code TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      vk_user_id TEXT DEFAULT '',
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notification_outbox (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      recipient TEXT NOT NULL,
      payload TEXT NOT NULL,
      booking_id TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      available_at TEXT NOT NULL,
      last_error TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      sent_at TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      booking_id TEXT DEFAULT '',
      client_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_vk_codes_master ON vk_connect_codes(master_id);
    CREATE INDEX IF NOT EXISTS idx_outbox_pending ON notification_outbox(status, available_at);
    CREATE INDEX IF NOT EXISTS idx_reviews_master ON reviews(master_id, status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_active_slot
    ON bookings(master_id, date, time)
    WHERE status != 'cancelled'
  `);

  const bookingCols2 = tableColumns(database, "bookings");
  if (!bookingCols2.has("manage_token")) {
    database.exec(
      "ALTER TABLE bookings ADD COLUMN manage_token TEXT DEFAULT ''"
    );
  }
  database.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_manage_token ON bookings(manage_token) WHERE manage_token != ''"
  );
}

export function parseSchedule(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return DEFAULT_SCHEDULE;
  }
}
