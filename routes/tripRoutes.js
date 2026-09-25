const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth');
const trip = require('../controllers/tripController');

const router = Router();
router.use(authMiddleware);

router.post('/request', trip.requestTrip);
router.get('/', trip.listTrips);
router.get('/active', trip.activeTrip);
router.get('/:id', trip.tripById);
router.post('/:id/accept', trip.accept);
router.post('/:id/status', trip.status);
router.post('/:id/cancel', trip.cancel);
router.post('/:id/rate', trip.rate);

module.exports = router;