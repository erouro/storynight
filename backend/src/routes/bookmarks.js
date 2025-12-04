const express = require('express');
const router = require('express').Router();
const { db } = require('../db');
const { userAuth } = require('../middleware/auth');
const uuid = require('uuid');

// add bookmark
router.post('/:storyId', userAuth, (req,res)=>{
  const storyId = req.params.storyId;
  const userId = req.user.user.id;
  const id = uuid.v4();
  db.prepare('INSERT INTO bookmarks (id,user_id,story_id,created_at) VALUES (?,?,?,?)').run(id, userId, storyId, Date.now());
  res.json({ ok:true, id });
});

// remove
router.delete('/:storyId', userAuth, (req,res)=>{
  const storyId = req.params.storyId;
  const userId = req.user.user.id;
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND story_id = ?').run(userId, storyId);
  res.json({ ok:true });
});

// list
router.get('/', userAuth, (req,res)=>{
  const userId = req.user.user.id;
  const rows = db.prepare('SELECT b.id,s.id as story_id,s.title FROM bookmarks b JOIN stories s ON b.story_id = s.id WHERE b.user_id = ? ORDER BY b.created_at DESC').all(userId);
  res.json(rows);
});

module.exports = router;
