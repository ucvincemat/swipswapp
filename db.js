const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("swipswap.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS swap_offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    user TEXT NOT NULL
  )`);
});

console.log("Database initialized.");

module.exports = db;