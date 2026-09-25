const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth');
const auth = require('../controllers/authController');

const router = Router();

router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.post('/request-otp', auth.requestOtp);
router.post('/verify-otp', auth.verifyOtp);
router.get('/me', authMiddleware, auth.me);

module.exports = router;