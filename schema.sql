CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT,
  last_name TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  items_json TEXT NOT NULL,
  total_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  final_price REAL NOT NULL,
  status TEXT DEFAULT 'Në Pritje',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

INSERT OR IGNORE INTO categories (id, name) VALUES (1, 'Profil PVC'), (2, 'Xham'), (3, 'Mekanizëm'), (4, 'Roletë');
INSERT OR IGNORE INTO units (id, name) VALUES (1, 'm²'), (2, 'cope'), (3, 'ml');

INSERT OR IGNORE INTO materials (id, name, category, unit, price) VALUES 
(1, 'Profil PVC 6 Komora (Gjermane)', 'Profil PVC', 'm²', 35.0),
(2, 'Profil PVC 5 Komora (Standard)', 'Profil PVC', 'm²', 25.0),
(3, 'Xham Dypalësh (4+16+4) me Argongas', 'Xham', 'm²', 18.0),
(4, 'Xham Triptik (4+12+4+12+4)', 'Xham', 'm²', 28.0),
(5, 'Mekanizëm Hapës/Rrotullues (Roto)', 'Mekanizëm', 'cope', 15.0),
(6, 'Roletë Alumini (Standard)', 'Roletë', 'm²', 30.0);

INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, 'admin', 'admin', 'Super Admin');

INSERT OR IGNORE INTO site_settings (key, value) VALUES 
('company_name', 'Dritare PVC Pro'),
('company_phone', '+355 69 00 00 000'),
('company_address', 'Tiranë, Shqipëri'),
('company_email', 'info@dritarepvc.al'),
('company_custom_info', 'Faleminderit për besimin! Oferta është e vlefshme për 15 ditë nga data e lëshimit.');
