// Run: node src/migrations/init.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const { db } = require('../db');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');

function tableExists(name) {
  const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  return !!r;
}

console.log('Running migrations...');

// stories
if (!tableExists('stories')) {
  db.prepare(`CREATE TABLE stories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    thumbnail_url TEXT,
    is_premium INTEGER DEFAULT 0,
    is_series_locked INTEGER DEFAULT 0,
    series_id TEXT,
    part_number INTEGER DEFAULT 1,
    views INTEGER DEFAULT 0,
    writer_id TEXT,
    created_at INTEGER,
    updated_at INTEGER
  )`).run();
  console.log('Created: stories');
}

// categories
if (!tableExists('categories')) {
  db.prepare(`CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    created_at INTEGER
  )`).run();
  console.log('Created: categories');
}

// story_categories
if (!tableExists('story_categories')) {
  db.prepare(`CREATE TABLE story_categories (
    story_id TEXT,
    category_id TEXT
  )`).run();
  console.log('Created: story_categories');
}

// writers (lekhak)
if (!tableExists('writers')) {
  db.prepare(`CREATE TABLE writers (
    id TEXT PRIMARY KEY,
    name TEXT,
    bio TEXT,
    created_at INTEGER
  )`).run();
  console.log('Created: writers');
}

// users
if (!tableExists('users')) {
  db.prepare(`CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    device_id TEXT,
    created_at INTEGER
  )`).run();
  console.log('Created: users');
}

// subscribers
if (!tableExists('subscribers')) {
  db.prepare(`CREATE TABLE subscribers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    plan TEXT,
    txn_ref TEXT,
    start_date INTEGER,
    end_date INTEGER,
    status TEXT,
    device_id TEXT,
    created_at INTEGER
  )`).run();
  console.log('Created: subscribers');
}

// donations
if (!tableExists('donations')) {
  db.prepare(`CREATE TABLE donations (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    amount REAL,
    txn_ref TEXT,
    message TEXT,
    created_at INTEGER
  )`).run();
  console.log('Created: donations');
}

// contact_messages
if (!tableExists('contact_messages')) {
  db.prepare(`CREATE TABLE contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    message TEXT,
    created_at INTEGER
  )`).run();
  console.log('Created: contact_messages');
}

// pending_stories (submissions)
if (!tableExists('pending_stories')) {
  db.prepare(`CREATE TABLE pending_stories (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    email TEXT,
    selected_category TEXT,
    author_name TEXT,
    file_name TEXT,
    tracking_id TEXT,
    created_at INTEGER
  )`).run();
  console.log('Created: pending_stories');
}

// bookmarks
if (!tableExists('bookmarks')) {
  db.prepare(`CREATE TABLE bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    story_id TEXT,
    created_at INTEGER
  )`).run();
  console.log('Created: bookmarks');
}

// reading_progress
if (!tableExists('reading_progress')) {
  db.prepare(`CREATE TABLE reading_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    story_id TEXT,
    percent REAL,
    position INTEGER,
    updated_at INTEGER
  )`).run();
  console.log('Created: reading_progress');
}

// settings
if (!tableExists('settings')) {
  db.prepare(`CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`).run();
  console.log('Created: settings');
}

// admin table (for storing additional admin users)
if (!tableExists('admins')) {
  db.prepare(`CREATE TABLE admins (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    created_at INTEGER
  )`).run();
  console.log('Created: admins');
}

// seed default categories and admin & plans
function now() { return Date.now(); }

const insertIfNotExists = (table, id, cols, values) => {
  const exists = db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id);
  if (!exists) {
    const placeholders = cols.map(()=>'?').join(',');
    db.prepare(`INSERT INTO ${table} (id, ${cols.join(',')}) VALUES (?, ${placeholders})`).run(id, ...values);
  }
};

const defaultCats = [
  { id: uuid.v4(), name: 'Romance' },
  { id: uuid.v4(), name: 'College' },
  { id: uuid.v4(), name: 'Desi' },
  { id: uuid.v4(), name: 'Thriller' },
  { id: uuid.v4(), name: 'Short' }
];

defaultCats.forEach(c=>{
  const slug = c.name.toLowerCase();
  db.prepare(`INSERT INTO categories (id,name,slug,created_at) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name=?)`)
    .run(c.id, c.name, slug, now(), c.name);
});

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPass123!';
const jwtSecret = process.env.JWT_SECRET || 'change_this_secret';

const adminExists = db.prepare('SELECT 1 FROM admins WHERE email = ?').get(adminEmail);
if (!adminExists) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare(`INSERT INTO admins (id,email,password_hash,created_at) VALUES (?,?,?,?)`).run(uuid.v4(), adminEmail, hash, now());
  console.log('Seeded admin:', adminEmail);
}

console.log('Migrations complete.');
process.exit(0);
