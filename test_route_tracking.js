// Self-check for the distance accumulated from driver pings.
// Run: node test_route_tracking.js
const assert = require('assert');
const { haversineKm } = require('./utils/distance');

const MIN_TRACK_KM = 0.02;

// Mirrors the accumulate step in services/driverService.js updateLocation().
function track(state, lat, lng) {
  const last = state.trail[state.trail.length - 1];
  const movedKm = last ? haversineKm(last.lat, last.lng, lat, lng) : 0;
  if (!last || movedKm >= MIN_TRACK_KM) {
    state.trail.push({ lat, lng });
    state.distanceKm = Math.round((state.distanceKm + movedKm) * 1000) / 1000;
  }
  return state;
}

// ~1.11 km per 0.01 degree of latitude.
let s = { trail: [{ lat: 37.0, lng: -122.0 }], distanceKm: 0 };
track(s, 37.01, -122.0);
track(s, 37.02, -122.0);
assert.strictEqual(s.trail.length, 3);
assert.ok(Math.abs(s.distanceKm - 2.223) < 0.01, `two legs: got ${s.distanceKm}`);

// Jitter below the threshold is dropped: no phantom distance while parked.
const before = s.distanceKm;
for (let i = 0; i < 50; i++) track(s, 37.02 + i * 1e-6, -122.0);
assert.strictEqual(s.trail.length, 3, 'jitter must not grow the trail');
assert.strictEqual(s.distanceKm, before, 'jitter must not add distance');

// A straight out-and-back records both legs, not the net displacement.
let b = { trail: [{ lat: 37.0, lng: -122.0 }], distanceKm: 0 };
track(b, 37.05, -122.0);
track(b, 37.0, -122.0);
assert.ok(b.distanceKm > 11, `out-and-back should be ~11.1 km, got ${b.distanceKm}`);

console.log('ok — route tracking');
