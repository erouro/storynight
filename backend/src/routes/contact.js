const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const { db } = require('../db');

// POST /api/contact
// { name, email, message }
router.post('/', (req,res)=>{
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
  const id = uuid.v4();
  db.prepare('INSERT INTO contact_messages (id,name,email,message,created_at) VALUES (?,?,?,?,?)')
    .run(id, name, email, message, Date.now());
  res.json({ ok:true, id });
});

module.exports = router;
