import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensures the database file is created in the project root
const dbPath = path.join(process.cwd(), 'stocksim.db');

// Ensure the directory exists if it's nested, though cwd() is root.
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');


function initializeDb() {
    console.log("Initializing database schema...");
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            cash REAL NOT NULL DEFAULT 100000,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS portfolio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            ticker TEXT NOT NULL,
            quantity REAL NOT NULL,
            avg_cost REAL NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, ticker)
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            ticker TEXT NOT NULL,
            type TEXT NOT NULL,
            quantity REAL NOT NULL,
            price REAL NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS watchlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            ticker TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, ticker)
        );

        CREATE TABLE IF NOT EXISTS portfolio_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            date TEXT NOT NULL,
            value REAL NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    `);
    console.log("Database initialized.");
}

// Run initialization logic only once
// In a real app, you might use a more robust migration system
try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableCheck) {
        initializeDb();
    }
} catch (error) {
    console.error("Database initialization failed:", error)
}
