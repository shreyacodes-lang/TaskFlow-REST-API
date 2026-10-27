const Database = require("better-sqlite3");

// SQLite database create/open 
const db = new Database(process.env.DB_FILE || "tasks.db");

// Tasks table create
db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

console.log("Database connected successfully!");
console.log("Tasks table is ready.");

module.exports = db;