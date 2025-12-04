const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const file = process.env.DATABASE_FILE || './data/storyhub.sqlite';
const dir = path.dirname(file);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(file);

// convenience wrapper: run and handle
function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}
function get(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

module.exports = { db, run, all, get };
