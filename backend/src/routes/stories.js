const express = require('express');
const router = express.Router();
const { db } = require('../db');

// helper for preview slicing
function slicePreview(content){
  if (!content) return '';
  const n = Math.max(50, Math.floor(content.length * 0.10));
  return content.slice(0, n);
}

// GET /api/stories  (supports q, category, page, perPage)
router.get('/', (req,res)=>{
  const q = (req.query.q || '').trim();
  const category = req.query.category;
  const page = parseInt(req.query.page || '1');
  const perPage = parseInt(req.query.perPage || '20');
  let where = '1=1';
  const params = [];

  if (q) {
    where += ' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (category) {
    // join with story_categories
    const sql = `SELECT s.* FROM stories s
      JOIN story_categories sc ON s.id = sc.story_id
      JOIN categories c ON sc.category_id = c.id
      WHERE c.name = ? ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
    const rows = db.prepare(sql).all(category, perPage, (page-1)*perPage);
    // provide preview excerpt
    const out = rows.map(r => {
      const preview = slicePreview(r.content || r.excerpt || '');
      return { ...r, preview };
    });
    return res.json(out);
  }

  const totalRow = db.prepare(`SELECT COUNT(*) as cnt FROM stories WHERE ${where}`).get(...params);
  const total = totalRow ? totalRow.cnt : 0;
  const sql = `SELECT * FROM stories WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(...params, perPage, (page-1)*perPage);
  const out = rows.map(r => ({ ...r, preview: slicePreview(r.content || r.excerpt || '') }));
  res.json({ data: out, total });
});

// GET /api/stories/:id
router.get('/:id', (req,res)=>{
  const id = req.params.id;
  const row = db.prepare('SELECT * FROM stories WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  // increment views
  db.prepare('UPDATE stories SET views = views + 1 WHERE id = ?').run(id);
  res.json(row);
});

module.exports = router;
