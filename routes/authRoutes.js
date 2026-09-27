const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth');
const auth = require('../controllers/authController');

const router = Router();

router.get('/me', authMiddleware, auth.me);

module.exports = router;
