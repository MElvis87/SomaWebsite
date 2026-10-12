-- Soma Orbit account database for Cloudflare D1.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'premium',
  status TEXT NOT NULL DEFAULT 'active',
  display_name TEXT NOT NULL,
  theme_color TEXT NOT NULL DEFAULT '#0a2463',
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);