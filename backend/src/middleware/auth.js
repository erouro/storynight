const jwt = require('jsonwebtoken');
const { get } = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Admin auth middleware
function adminAuth(req,res,next){
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'Missing auth' });
  const token = h.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || !payload.admin) return res.status(401).json({ error: 'Invalid token' });
    req.admin = payload;
    next();
  } catch(err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// User auth (optional) - returns user id if valid
function userAuth(req,res,next){
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'Missing auth' });
  const token = h.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || !payload.user) return res.status(401).json({ error: 'Invalid token' });
    req.user = payload;
    next();
  } catch(err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { adminAuth, userAuth };
