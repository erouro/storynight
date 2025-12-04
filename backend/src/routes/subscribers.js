const express = require('express');
const router = express.Router();
const { db } = require('../db');
const uuid = require('uuid');

// POST /api/subscribers (subscribe request; precondition: user must be registered already)
// body: { email, plan, txn_ref, device_id }
router.post('/', (req,res)=>{
  const { email, plan, txn_ref, device_id } = req.body;
  if (!email || !plan || !txn_ref) return res.status(400).json({ error: 'Missing' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'User not found. Register first.' });

  const id = uuid.v4();
  db.prepare('INSERT INTO subscribers (id,user_id,plan,txn_ref,status,device_id,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, user.id, plan, txn_ref, 'pending', device_id || null, Date.now());
  res.json({ ok: true, id });
});

// check subscription by device/user
router.get('/check', (req,res)=>{
  const { device_id, user_id } = req.query;
  if (!device_id && !user_id) return res.json({ active: false });
  let row;
  if (user_id) row = db.prepare('SELECT * FROM subscribers WHERE user_id = ? AND status = ?').get(user_id, 'active');
  else row = db.prepare('SELECT * FROM subscribers WHERE device_id = ? AND status = ?').get(device_id, 'active');
  if (!row) return res.json({ active: false });
  // lazy expire check
  if (row.end_date && Date.now() > row.end_date) {
    db.prepare('UPDATE subscribers SET status = ? WHERE id = ?').run('expired', row.id);
    return res.json({ active: false });
  }
  res.json({ active: true, plan: row.plan, ends: row.end_date });
});

module.exports = router;
