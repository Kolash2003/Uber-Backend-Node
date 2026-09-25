const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const { JWT_SECRET } = require('../config/constants');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) return res.status(401).json({ error: 'Account not found' });

  req.user = user;
  req.userId = user.id;
  next();
}

module.exports = { authMiddleware };