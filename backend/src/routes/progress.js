const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { userAuth } = require('../middleware/auth');
const uuid = require('uuid');

// update progress
router.patch('/update', userAuth, (req,res)=>{
  const { story_id, percent, position } = req.body;
  if (!story_id) return res.status(400).json({ error: 'Missing' });
  const userId = req.user.user.id;
  const existing = db.prepare('SELECT id FROM reading_progress WHERE user_id = ? AND story_id = ?').get(userId, story_id);
  if (existing) {
    db.prepare('UPDATE reading_progress SET percent = ?, position = ?, updated_at = ? WHERE id = ?')
      .run(percent, position, Date.now(), existing.id);
    return res.json({ ok:true });
  } else {
    const id = uuid.v4();
    db.prepare('INSERT INTO reading_progress (id,user_id,story_id,percent,position,updated_at) VALUES (?,?,?,?,?,?)')
      .run(id, userId, story_id, percent, position, Date.now());
    return res.json({ ok:true });
  }
});

// get progress for story
router.get('/:storyId', userAuth, (req,res)=>{
  const userId = req.user.user.id;
  const storyId = req.params.storyId;
  const row = db.prepare('SELECT percent,position FROM reading_progress WHERE user_id = ? AND story_id = ?').get(userId, storyId);
  res.json(row || { percent: 0, position: 0 });
});

module.exports = router;
