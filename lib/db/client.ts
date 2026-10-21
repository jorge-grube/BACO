// Cliente SQLite del prototipo. Todo el acceso a datos pasa por lib/db/*:
// para migrar a Supabase solo hay que reescribir esta carpeta.
import Database from "better-sqlite3";
import path from "node:path";
import { ensureDemoExtras } from "./demo-extras";

const DB_PATH = process.env.BACO_DB_PATH ?? path.join(process.cwd(), "data", "baco.db");

export const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('hostelero','productor','consumidor','equipo')),
  name TEXT NOT NULL,
  phone TEXT,
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
  verified_at TEXT,
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

-- Peticiones de ayuda ("que me llamen"). No requieren cuenta; las atiende Aplus.
CREATE TABLE IF NOT EXISTS help_requests (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('manana','tarde','cualquiera')),
  topic TEXT,
  page TEXT,
  profile_id TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','llamada')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Avisos que BACO "envía" por WhatsApp, SMS o correo. En la demo no salen del servidor:
-- se guardan aquí y se ven en /demo/avisos y en el panel de cada persona.
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','sms','email')),
  profile_id TEXT,
  phone TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Enlaces de un solo uso: responder una petición sin entrar, revisar la página preparada por el equipo.
CREATE TABLE IF NOT EXISTS magic_links (
  token TEXT PRIMARY KEY,
  purpose TEXT NOT NULL CHECK (purpose IN ('responder','revisar')),
  profile_id TEXT,
  request_id INTEGER,
  onboarding_id INTEGER,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

-- Códigos de acceso por SMS (entrar sin contraseña).
CREATE TABLE IF NOT EXISTS login_codes (
  id INTEGER PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Agenda en persona: mercados y ferias reales (con enlace) y actividades de BACO (de ejemplo).
CREATE TABLE IF NOT EXISTS agenda (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('mercado','feria','encuentro','taller','ruta','alta')),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  end_date TEXT,
  date_note TEXT,
  time TEXT,
  place TEXT NOT NULL,
  municipality TEXT,
  organizer TEXT NOT NULL,
  url TEXT,
  description TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('productores','hosteleros','consumidores','todos')),
  by_baco INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER,
  is_mock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agenda_signups (
  id INTEGER PRIMARY KEY,
  agenda_id INTEGER NOT NULL REFERENCES agenda(id),
  profile_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Puesto compartido de BACO en mercadillos (venta al consumidor).
CREATE TABLE IF NOT EXISTS stall_days (
  id INTEGER PRIMARY KEY,
  market TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  place TEXT NOT NULL,
  municipality TEXT NOT NULL,
  deadline TEXT NOT NULL,
  drop_off TEXT NOT NULL,
  commission REAL NOT NULL,
  max_products INTEGER NOT NULL,
  agenda_id INTEGER REFERENCES agenda(id)
);

CREATE TABLE IF NOT EXISTS stall_slots (
  id INTEGER PRIMARY KEY,
  stall_day_id INTEGER NOT NULL REFERENCES stall_days(id),
  producer_id INTEGER NOT NULL REFERENCES producers(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  unit_label TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  sold INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado','aceptado','rechazado')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stall_reservations (
  id INTEGER PRIMARY KEY,
  slot_id INTEGER NOT NULL REFERENCES stall_slots(id),
  profile_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reservada' CHECK (status IN ('reservada','recogida','cancelada')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Alta asistida: el equipo prepara la página del productor y él solo la revisa.
CREATE TABLE IF NOT EXISTS onboardings (
  id INTEGER PRIMARY KEY,
  producer_id INTEGER NOT NULL REFERENCES producers(id),
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  met_at TEXT,
  description TEXT,
  capacity_note TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador','enviado','publicado','cambios')),
  feedback TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Distintivo voluntario para restaurantes que compran a productores de BACO.
CREATE TABLE IF NOT EXISTS badges (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('solicitado','concedido')),
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  granted_at TEXT
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS sponsorships (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  boost REAL NOT NULL CHECK (boost <= 0.05),
  ends_at TEXT NOT NULL
);
`;

// Bases creadas con una versión anterior del esquema: añade columnas y amplía el rol.
// SQLite no deja cambiar un CHECK, así que la tabla de perfiles se reconstruye una vez.
function migrate(conn: Database.Database) {
  const tableSql = (name: string) =>
    (conn.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`).get(name) as { sql: string } | undefined)?.sql;
  const hasColumn = (table: string, col: string) =>
    (conn.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).some((c) => c.name === col);

  const profiles = tableSql("profiles");
  if (profiles && !profiles.includes("'equipo'")) {
    conn.pragma("foreign_keys = OFF");
    conn.exec(`
      BEGIN;
      CREATE TABLE profiles_new (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK (role IN ('hostelero','productor','consumidor','equipo')),
        name TEXT NOT NULL,
        phone TEXT,
        business_name TEXT,
        business_type TEXT,
        municipality TEXT,
        lat REAL,
        lng REAL,
        is_demo INTEGER NOT NULL DEFAULT 0
      );
      INSERT INTO profiles_new (id, role, name, business_name, business_type, municipality, lat, lng, is_demo)
        SELECT id, role, name, business_name, business_type, municipality, lat, lng, is_demo FROM profiles;
      DROP TABLE profiles;
      ALTER TABLE profiles_new RENAME TO profiles;
      COMMIT;`);
    conn.pragma("foreign_keys = ON");
  }
  if (tableSql("producers") && !hasColumn("producers", "verified_at")) conn.exec(`ALTER TABLE producers ADD COLUMN verified_at TEXT`);
  if (tableSql("login_codes") && !hasColumn("login_codes", "attempts")) conn.exec(`ALTER TABLE login_codes ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0`);
  // SQLite no deja añadir una columna con DEFAULT (datetime('now')): se añade vacía y se rellena.
  if (tableSql("login_codes") && !hasColumn("login_codes", "created_at")) conn.exec(`ALTER TABLE login_codes ADD COLUMN created_at TEXT; UPDATE login_codes SET created_at = datetime('now')`);
}

const globalForDb = globalThis as unknown as { bacoDb?: Database.Database };

export function db(): Database.Database {
  if (!globalForDb.bacoDb) {
    const conn = new Database(DB_PATH);
    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");
    migrate(conn);
    conn.exec(SCHEMA);
    ensureDemoExtras(conn);
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
