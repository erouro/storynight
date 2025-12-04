const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { storyToPdfStream } = require('../utils/pdfgen');
const { userAuth } = require('../middleware/auth');

router.get('/story/:id', userAuth, (req,res)=>{
  // ensure user is subscriber active
  const userId = req.user.user.id;
  const sub = db.prepare('SELECT * FROM subscribers WHERE user_id = ? AND status = ?').get(userId, 'active');
  if (!sub) return res.status(403).json({ error: 'Subscription required' });

  const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(req.params.id);
  if (!story) return res.status(404).json({ error: 'Not found' });

  const doc = storyToPdfStream(story);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${(story.title||'story').replace(/\s+/g,'_')}.pdf"`);
  doc.pipe(res);
});
module.exports = router;
