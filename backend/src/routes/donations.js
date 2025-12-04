const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const { db } = require('../db');

// POST /api/donations
// { name, email (opt), amount, txn_ref, message }
router.post('/', (req,res)=>{
  const { name, email, amount, txn_ref, message } = req.body;
  if (!name || !amount) return res.status(400).json({ error: 'Missing' });
  const id = uuid.v4();
  db.prepare('INSERT INTO donations (id,name,email,amount,txn_ref,message,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, name, email || null, amount, txn_ref || null, message || null, Date.now());
  // immediate thank you screen handled in frontend; no admin approval
  res.json({ ok:true, id });
});

// admin list - protected in admin routes
module.exports = router;
