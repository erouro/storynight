const express = require('express');
const router = express.Router();
const { db } = require('../db');
const uuid = require('uuid');

// list categories
router.get('/', (req,res)=>{
  const rows = db.prepare('SELECT id,name,slug FROM categories ORDER BY name ASC').all();
  res.json(rows);
});

module.exports = router;
