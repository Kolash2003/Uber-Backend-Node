const { asyncHandler } = require('../utils/errors');
const tripService = require('../services/tripService');

const requestTrip = asyncHandler(async (req, res) => {
  const result = await tripService.createBooking(req.userId, req.body);
  res.status(201).json(result);
});

const listTrips = asyncHandler(async (req, res) => {
  res.json(await tripService.listTrips(req.userId, req.user.role));
});

const activeTrip = asyncHandler(async (req, res) => {
  res.json(await tripService.getActiveTrip(req.userId));
});

const tripById = asyncHandler(async (req, res) => {
  res.json(await tripService.getTripById(req.params.id, req.userId, req.user.role));
});

const accept = asyncHandler(async (req, res) => {
  res.json(await tripService.acceptTrip(req.params.id, req.user));
});

const status = asyncHandler(async (req, res) => {
  res.json(await tripService.updateTripStatus(req.params.id, req.userId, req.body.status));
});

const cancel = asyncHandler(async (req, res) => {
  res.json(await tripService.cancelTrip(req.params.id, req.userId));
});

const rate = asyncHandler(async (req, res) => {
  res.json(await tripService.rateTrip(req.params.id, req.userId, req.body));
});

module.exports = { requestTrip, listTrips, activeTrip, tripById, accept, status, cancel, rate };