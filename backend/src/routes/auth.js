const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const uuid = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Admin login route
router.post('/login', async (req,res)=>{
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing' });

  // check admins
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (admin) {
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid' });
    const token = jwt.sign({ admin: { id: admin.id, email: admin.email } }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token, role: 'admin' });
  }

  // check users (readers/subscribers)
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid' });

  const token = jwt.sign({ user: { id: user.id, email: user.email } }, JWT_SECRET, { expiresIn: '30d' });
  return res.json({ token, role: 'user' });
});

// register user (used at subscribe page before posting txn)
router.post('/register', async (req,res)=>{
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing' });
  // check exists
  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
  if (exists) return res.status(400).json({ error: 'Email exists' });
  const hash = await bcrypt.hash(password, 10);
  const id = uuid.v4();
  const device_id = req.body.device_id || null;
  db.prepare('INSERT INTO users (id,name,email,password_hash,device_id,created_at) VALUES (?,?,?,?,?,?)')
    .run(id, name, email, hash, device_id, Date.now());
  res.json({ ok: true, id });
});

module.exports = router;
