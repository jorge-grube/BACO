// Cliente SQLite del prototipo. Todo el acceso a datos pasa por lib/db/*:
// para migrar a Supabase solo hay que reescribir esta carpeta.
import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = process.env.BACO_DB_PATH ?? path.join(process.cwd(), "data", "baco.db");

export const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('hostelero','productor','consumidor')),
  name TEXT NOT NULL,
  business_name TEXT,
  business_type TEXT,
  municipality TEXT,
  lat REAL,
  lng REAL,
  is_demo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS producers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  owner_profile_id TEXT REFERENCES profiles(id),
  municipality TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  capacity_note TEXT,
  is_mock INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  producer_id INTEGER NOT NULL REFERENCES producers(id),
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  unit TEXT NOT NULL,
  price_hint REAL,
  monthly_capacity REAL,
  is_eco INTEGER NOT NULL DEFAULT 0,
  search_text TEXT NOT NULL,
  embedding TEXT,
  source_url TEXT NOT NULL,
  is_mock INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS products_category ON products(category);
CREATE INDEX IF NOT EXISTS products_producer ON products(producer_id);

CREATE TABLE IF NOT EXISTS product_labels (
  product_id INTEGER NOT NULL REFERENCES products(id),
  label_code TEXT NOT NULL,
  PRIMARY KEY (product_id, label_code)
);

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY,
  from_profile_id TEXT NOT NULL REFERENCES profiles(id),
  producer_id INTEGER NOT NULL REFERENCES producers(id),
  product_id INTEGER REFERENCES products(id),
  type TEXT NOT NULL CHECK (type IN ('muestra','pedido','contacto')),
  quantity TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviada' CHECK (status IN ('enviada','vista','respondida','cerrada')),
  reply TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  is_mock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  notify INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (profile_id, product_id)
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  title TEXT NOT NULL,
  valid_until TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  profile_id TEXT,
  product_id INTEGER REFERENCES products(id),
  type TEXT NOT NULL CHECK (type IN ('view','search_hit','favorite','request')),
  ts TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS events_product_ts ON events(product_id, ts);

CREATE TABLE IF NOT EXISTS sponsorships (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  boost REAL NOT NULL CHECK (boost <= 0.05),
  ends_at TEXT NOT NULL
);
`;

const globalForDb = globalThis as unknown as { bacoDb?: Database.Database };

export function db(): Database.Database {
  if (!globalForDb.bacoDb) {
    const conn = new Database(DB_PATH);
    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");
    conn.exec(SCHEMA);
    globalForDb.bacoDb = conn;
  }
  return globalForDb.bacoDb;
}

export function openFresh(file = DB_PATH): Database.Database {
  const conn = new Database(file);
  conn.pragma("foreign_keys = ON");
  conn.exec(SCHEMA);
  return conn;
}
