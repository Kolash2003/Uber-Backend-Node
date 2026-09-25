const prisma = require('../prisma/client');
const { HttpError } = require('../utils/errors');
const { haversineKm } = require('../utils/distance');
const { relay } = require('../utils/socketRelay');
const { AVERAGE_SPEED_KMH } = require('../config/constants');

const ACTIVE_STATUSES = ['en_route', 'arrived', 'in_progress'];

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
    const distanceKm = haversineKm(latitude, longitude, dropoff.lat, dropoff.lng);
    const etaSeconds = Math.max(30, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 3600));
    await prisma.booking.update({ where: { id: active.id }, data: { etaSeconds } });
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