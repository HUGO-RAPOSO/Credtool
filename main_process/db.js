const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

let db = null;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function initDb() {
  // Lazy init: only called after app is ready, so app.getPath works
  const { app } = require('electron');
  const dbPath = path.join(app.getPath('userData'), 'credtool.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      bi TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      rate REAL NOT NULL,
      term_months INTEGER NOT NULL,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME,
      status TEXT DEFAULT 'ACTIVE',
      remaining_balance REAL NOT NULL,
      notes TEXT,
      last_interest_calc DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(loan_id) REFERENCES loans(id)
    );

    CREATE TABLE IF NOT EXISTS licenses (
      key TEXT PRIMARY KEY,
      type TEXT,
      activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );

    -- Migration: Add last_interest_calc to loans if it doesn't exist
    PRAGMA table_info(loans);
  `);

  // Check if column exists and add it if missing
  const columns = db.prepare("PRAGMA table_info(loans)").all();
  if (!columns.some(c => c.name === 'last_interest_calc')) {
    // SQLite doesn't allow CURRENT_TIMESTAMP as a default in ALTER TABLE ADD COLUMN
    db.exec("ALTER TABLE loans ADD COLUMN last_interest_calc DATETIME");
    db.exec("UPDATE loans SET last_interest_calc = CURRENT_TIMESTAMP WHERE last_interest_calc IS NULL");
  }

  // Seed default admin user if not exists
  const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (!adminExists) {
    db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)").run(
      'admin',
      hashPassword('admin123'),
      'admin'
    );
  }
}

function getDb() {
  return db;
}

module.exports = { getDb, initDb, hashPassword };
