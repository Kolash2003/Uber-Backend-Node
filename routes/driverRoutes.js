const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth');
const driver = require('../controllers/driverController');

const router = Router();
router.use(authMiddleware);

router.post('/location', driver.updateLocation);
router.post('/online', driver.setOnline);

module.exports = router;