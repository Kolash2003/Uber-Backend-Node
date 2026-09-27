const prisma = require('../prisma/client');
const { BETTER_AUTH_URL } = require('../config/constants');

async function authMiddleware(req, res, next) {
  const cookie = req.headers.cookie || '';

  let session;
  try {
    const response = await fetch(`${BETTER_AUTH_URL}/api/auth/get-session`, {
      headers: cookie ? { cookie } : {},
    });
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    session = await response.json();
  } catch (err) {
    console.error('[authMiddleware] failed to validate session', err);
    return res.status(503).json({ error: 'Auth service unavailable' });
  }

  const userId = session?.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Missing or invalid session' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ error: 'Account not found' });

  req.user = user;
  req.userId = user.id;
  next();
}

module.exports = { authMiddleware };
