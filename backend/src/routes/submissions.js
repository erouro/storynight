const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'tmp_uploads/', limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB
const { extractTextFromFile } = require('../utils/textExtract');
const uuid = require('uuid');
const fs = require('fs');
const { db } = require('../db');

// POST /api/submit-story
// fields: title, content (text), email, selected_category, author_name
// file: upload (optional). If file present, we'll extract and delete.
router.post('/', upload.single('file'), async (req,res)=>{
  try {
    const { title, content, email, selected_category, author_name } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    if (!content && !req.file) return res.status(400).json({ error: 'Either content or file required' });
    let extracted = content || '';
    if (req.file) {
      try {
        extracted = await extractTextFromFile(req.file.path, req.file.mimetype);
      } catch(err) {
        console.error('extract error', err);
        return res.status(500).json({ error: 'Failed to extract file text' });
      } finally {
        // delete file
        try { fs.unlinkSync(req.file.path); } catch(e){}
      }
    }
    const id = uuid.v4();
    const tracking = 'PS-' + Date.now().toString().slice(-6);
    db.prepare('INSERT INTO pending_stories (id,title,content,email,selected_category,author_name,file_name,tracking_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, title, extracted, email || null, selected_category || null, author_name || null, null, tracking, Date.now());
    return res.json({ ok:true, id, tracking_id: tracking });
  } catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
