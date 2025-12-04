require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// rate limiter basic
const limiter = rateLimit({ windowMs: 10*1000, max: 60 });
app.use(limiter);

// static (if needed)
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// health
app.get('/api/health', (req, res) => res.json({ ok: true, now: Date.now() }));

// attach routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/submit-story', require('./routes/submissions'));
app.use('/api/writers', require('./routes/writers'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/admin', require('./routes/admin'));

// pdf endpoint
app.use('/api/pdf', require('./routes/pdf'));

// 404
app.use((req,res)=>res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
