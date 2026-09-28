const prisma = require('../prisma/client');
const { HttpError } = require('../utils/errors');
const { haversineKm } = require('../utils/distance');
const { relay } = require('../utils/socketRelay');
const { AVERAGE_SPEED_KMH } = require('../config/constants');

const ACTIVE_STATUSES = ['en_route', 'arrived', 'in_progress'];
const MIN_TRACK_KM = 0.02;

async function updateLocation(driverId, { latitude, longitude }) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new HttpError(400, 'latitude and longitude must be numbers');
  }

  const user = await prisma.user.update({
    where: { id: driverId },
    data: { lastLat: latitude, lastLng: longitude },
  });

  const active = await prisma.booking.findFirst({
    where: { driverId, status: { in: ACTIVE_STATUSES } },
  });
  if (active) {
    const dropoff = active.dropoff.location;
    const remainingKm = haversineKm(latitude, longitude, dropoff.lat, dropoff.lng);
    const etaSeconds = Math.max(30, Math.round((remainingKm / AVERAGE_SPEED_KMH) * 3600));
    const data = { etaSeconds };

    // Only the in_progress leg is the ride itself; pings while en_route to the
    // pickup would inflate the rider's distance.
    if (active.status === 'in_progress') {
      const trail = Array.isArray(active.routePolyline) ? active.routePolyline : [];
      const last = trail[trail.length - 1];
      const movedKm = last ? haversineKm(last.lat, last.lng, latitude, longitude) : 0;
      // ponytail: drop sub-20m jitter so the trail stays small; swap for a real
      // map-matching service if the path needs to follow roads.
      if (!last || movedKm >= MIN_TRACK_KM) {
        data.routePolyline = [...trail, { lat: latitude, lng: longitude }];
        data.distanceKm = Math.round(((active.distanceKm || 0) + movedKm) * 1000) / 1000;
      }
    }

    await prisma.booking.update({ where: { id: active.id }, data });
    await relay({
      event: 'trip:driver-location',
      payload: { tripId: active.id, lat: latitude, lng: longitude },
      riderIds: [active.passengerId],
    });
    await relay({
      event: 'trip:eta',
      payload: { tripId: active.id, etaSeconds },
      riderIds: [active.passengerId],
    });
  }

  return { ok: true, latitude, longitude };
}

async function setOnline(driverId, online) {
  await prisma.user.update({
    where: { id: driverId },
    data: { isOnline: Boolean(online) },
  });
  return { ok: true, online: Boolean(online) };
}

module.exports = { updateLocation, setOnline };