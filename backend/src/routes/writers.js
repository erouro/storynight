const express = require('express');
const router = express.Router();
const { db } = require('../db');

// list writers
router.get('/', (req,res)=>{
  const rows = db.prepare('SELECT id,name,bio FROM writers ORDER BY name').all();
  res.json(rows);
});

// writer detail + their stories
router.get('/:id', (req,res)=>{
  const id = req.params.id;
  const writer = db.prepare('SELECT id,name,bio FROM writers WHERE id = ?').get(id);
  if (!writer) return res.status(404).json({ error: 'Not found' });
  const stories = db.prepare('SELECT id,title,excerpt,is_premium,created_at FROM stories WHERE writer_id = ? ORDER BY created_at DESC').all(id);
  res.json({ writer, stories });
});

module.exports = router;
