const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth');
const user = require('../controllers/userController');
const lookup = require('../controllers/lookupController');

const router = Router();

router.get('/saved-places', authMiddleware, user.savedPlaces);
router.get('/payment-methods', authMiddleware, user.paymentMethods);
router.get('/earnings', authMiddleware, user.earnings);
router.get('/geocode', lookup.geocodePlaces);
router.get('/fare/estimate', lookup.fareEstimate);

module.exports = router;