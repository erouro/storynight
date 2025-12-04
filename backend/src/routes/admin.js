const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { adminAuth } = require('../middleware/auth');
const uuid = require('uuid');

// Admin: list pending subscribers
router.get('/subscribers', adminAuth, (req,res)=>{
  const rows = db.prepare('SELECT s.*, u.email, u.name FROM subscribers s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC').all();
  res.json(rows);
});

// Admin verify subscription: POST /api/admin/subscribers/verify/:id
router.post('/subscribers/verify/:id', adminAuth, (req,res)=>{
  const id = req.params.id;
  const sub = db.prepare('SELECT * FROM subscribers WHERE id = ?').get(id);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  // set start and end based on plan
  const now = Date.now();
  let months = 1;
  if (sub.plan === '1M' || sub.plan === '199') months = 1;
  else if (sub.plan === '3M' || sub.plan === '299') months = 3;
  else if (sub.plan === '6M' || sub.plan === '499') months = 6;
  else if (sub.plan === '1Y' || sub.plan === '699') months = 12;
  const end = new Date();
  end.setMonth(end.getMonth() + months);
  const endTs = end.getTime();
  db.prepare('UPDATE subscribers SET status = ?, start_date = ?, end_date = ?, device_id = ? WHERE id = ?')
    .run('active', now, endTs, req.body.device_id || sub.device_id, id);

  // mark user device binding if device id provided
  if (req.body.device_id) {
    db.prepare('UPDATE users SET device_id = ? WHERE id = ?').run(req.body.device_id, sub.user_id);
  }

  res.json({ ok:true, ends: endTs });
});

// Admin: list pending submissions
router.get('/submissions', adminAuth, (req,res)=>{
  const rows = db.prepare('SELECT * FROM pending_stories ORDER BY created_at DESC').all();
  res.json(rows);
});

// Admin approve submission: POST /api/admin/submissions/approve/:id
router.post('/submissions/approve/:id', adminAuth, (req,res)=>{
  const id = req.params.id;
  const pending = db.prepare('SELECT * FROM pending_stories WHERE id = ?').get(id);
  if (!pending) return res.status(404).json({ error: 'Not found' });
  // create story record
  const storyId = uuid.v4();
  const excerpt = (pending.content || '').slice(0, 220);
  db.prepare('INSERT INTO stories (id,title,excerpt,content,created_at,updated_at) VALUES (?,?,?,?,?,?)')
    .run(storyId, pending.title, excerpt, pending.content, Date.now(), Date.now());
  // assign category later by admin via categories route if needed
  // delete pending
  db.prepare('DELETE FROM pending_stories WHERE id = ?').run(id);
  res.json({ ok:true, storyId });
});

// admin list donations
router.get('/donations', adminAuth, (req,res)=>{
  const rows = db.prepare('SELECT * FROM donations ORDER BY created_at DESC').all();
  res.json(rows);
});

// admin list contact messages
router.get('/contacts', adminAuth, (req,res)=>{
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  res.json(rows);
});

// admin categories CRUD (simple)
router.get('/categories', adminAuth, (req,res)=>{
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(rows);
});
router.post('/categories', adminAuth, (req,res)=>{
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing' });
  const id = uuid.v4();
  const slug = name.toLowerCase();
  db.prepare('INSERT INTO categories (id,name,slug,created_at) VALUES (?,?,?,?)').run(id, name, slug, Date.now());
  res.json({ ok:true, id });
});
router.put('/categories/:id', adminAuth, (req,res)=>{
  const id = req.params.id;
  const { name } = req.body;
  db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').run(name, name.toLowerCase(), id);
  res.json({ ok:true });
});
router.delete('/categories/:id', adminAuth, (req,res)=>{
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok:true });
});

// admin stories CRUD (basic)
router.get('/stories', adminAuth, (req,res)=>{
  const rows = db.prepare('SELECT * FROM stories ORDER BY created_at DESC').all();
  res.json(rows);
});
router.post('/stories', adminAuth, (req,res)=>{
  const { title, content, is_premium, writer_id } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing' });
  const id = uuid.v4();
  const excerpt = (content || '').slice(0,220);
  db.prepare('INSERT INTO stories (id,title,excerpt,content,is_premium,writer_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, title, excerpt, content || '', is_premium ? 1:0, writer_id || null, Date.now(), Date.now());
  res.json({ ok:true, id });
});
router.put('/stories/:id', adminAuth, (req,res)=>{
  const id = req.params.id;
  const { title, content, is_premium, writer_id } = req.body;
  const excerpt = (content || '').slice(0,220);
  db.prepare('UPDATE stories SET title = ?, content = ?, excerpt = ?, is_premium = ?, writer_id = ?, updated_at = ? WHERE id = ?')
    .run(title, content, excerpt, is_premium ? 1:0, writer_id || null, Date.now(), id);
  res.json({ ok:true });
});
router.delete('/stories/:id', adminAuth, (req,res)=>{
  db.prepare('DELETE FROM stories WHERE id = ?').run(req.params.id);
  res.json({ ok:true });
});

module.exports = router;
