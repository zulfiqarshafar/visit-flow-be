const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbDirectory = __dirname;
const dbPath = path.join(dbDirectory, "visitflow.db");

if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    segment TEXT NOT NULL CHECK (segment IN ('B2G', 'B2B')),
    region TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, type, segment, region)
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER NOT NULL,
    visit_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NOT_VISITED'
      CHECK (status IN ('NOT_VISITED', 'VISITED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id)
  );

  CREATE INDEX IF NOT EXISTS idx_activities_visit_date
    ON activities(visit_date);

  CREATE INDEX IF NOT EXISTS idx_activities_status
    ON activities(status);

  CREATE INDEX IF NOT EXISTS idx_entities_segment
    ON entities(segment);

  CREATE INDEX IF NOT EXISTS idx_activities_entity_id
    ON activities(entity_id);
`);

console.log("Database connected and tables initialized");

module.exports = db;
