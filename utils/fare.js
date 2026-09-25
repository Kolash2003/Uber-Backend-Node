const {
  RIDE_TYPES,
  BASIC_FARE,
  RATE_PER_KM,
  RATE_PER_MINUTE,
  SURGE,
  DISTANCE_SCALE_FACTOR,
  AVERAGE_SPEED_KMH,
} = require('../config/constants');
const { haversineKm } = require('./distance');

function buildFareEstimate(pickup, dropoff, rideType) {
  const distanceKm = haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const roadKm = distanceKm * DISTANCE_SCALE_FACTOR;
  const minutes = (roadKm / AVERAGE_SPEED_KMH) * 60;
  const meta = RIDE_TYPES.find((r) => r.id === rideType) || RIDE_TYPES[0];
  const base = BASIC_FARE * meta.multiplier;
  const distanceFare = RATE_PER_KM * roadKm * meta.multiplier;
  const timeFare = RATE_PER_MINUTE * minutes * meta.multiplier;
  const total = Math.round((base + distanceFare + timeFare) * SURGE * 100) / 100;
  return {
    rideType: meta.id,
    base: Math.round(base * 100) / 100,
    distanceFare: Math.round(distanceFare * 100) / 100,
    timeFare: Math.round(timeFare * 100) / 100,
    surge: SURGE,
    total,
    currency: 'USD',
    estimatedDistanceMiles: Math.round((roadKm * 0.621371) * 10) / 10,
    estimatedDurationMinutes: Math.max(1, Math.round(minutes)),
  };
}

function buildAllFareEstimates(pickup, dropoff) {
  return RIDE_TYPES.map((r) => buildFareEstimate(pickup, dropoff, r.id));
}

module.exports = { buildFareEstimate, buildAllFareEstimates, RIDE_TYPES };