import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { DEFAULT_SCHEDULE } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "booking.db");

let db: Database.Database | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDb(): Database.Database {
  if (!db) {
    ensureDataDir();
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS masters (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      specialty TEXT DEFAULT '',
      address TEXT DEFAULT '',
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
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_master_date ON bookings(master_id, date);
    CREATE INDEX IF NOT EXISTS idx_services_master ON services(master_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_master ON portfolio(master_id);
  `);
}

export function parseSchedule(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return DEFAULT_SCHEDULE;
  }
}
