const { asyncHandler, HttpError } = require('../utils/errors');
const { geocode } = require('../utils/places');
const { buildAllFareEstimates } = require('../utils/fare');

const geocodePlaces = asyncHandler(async (req, res) => {
  res.json(geocode(req.query.q));
});

const fareEstimate = asyncHandler(async (req, res) => {
  const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.query;
  const nums = [pickupLat, pickupLng, dropoffLat, dropoffLng].map(Number);
  if (nums.some((n) => Number.isNaN(n))) {
    throw new HttpError(400, 'pickupLat, pickupLng, dropoffLat, dropoffLng are required');
  }
  res.json(
    buildAllFareEstimates(
      { lat: nums[0], lng: nums[1] },
      { lat: nums[2], lng: nums[3] }
    )
  );
});

module.exports = { geocodePlaces, fareEstimate };