const prisma = require('../prisma/client');
const { HttpError } = require('../utils/errors');
const { haversineKm } = require('../utils/distance');
const { buildFareEstimate } = require('../utils/fare');
const { relay } = require('../utils/socketRelay');
const {
  NEARBY_DRIVER_RADIUS_KM,
  REQUEST_WINDOW_SECONDS,
  AVERAGE_SPEED_KMH,
  RIDE_TYPES,
} = require('../config/constants');

// tripId -> { interval, timeout, driverIds }
const requestTimers = new Map();

const TERMINAL_STATUSES = ['completed', 'cancelled'];

function driverPayload(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    rating: user.rating,
    totalTrips: user.totalTrips,
    photoUrl: user.photoUrl,
    phoneNumber: user.phoneNumber,
    vehicle: user.vehicle,
    location: user.lastLat != null && user.lastLng != null ? { lat: user.lastLat, lng: user.lastLng } : null,
  };
}

function serializeTrip(booking) {
  const trip = {
    id: booking.id,
    status: booking.status,
    rideType: booking.rideType,
    pickup: booking.pickup,
    dropoff: booking.dropoff,
    fare: booking.fare,
    paymentMethodId: booking.paymentMethodId,
  };
  if (booking.driver) {
    trip.driver = driverPayload(booking.driver);
  }
  if (booking.etaSeconds != null) trip.etaSeconds = booking.etaSeconds;
  if (booking.startedAt) trip.startedAt = booking.startedAt;
  if (booking.completedAt) trip.completedAt = booking.completedAt;
  if (booking.rating != null) trip.rating = booking.rating;
  if (booking.tip != null) trip.tip = booking.tip;
  return trip;
}

const tripInclude = { driver: true };

async function findNearbyDriverIds(pickup, radiusKm = NEARBY_DRIVER_RADIUS_KM) {
  const drivers = await prisma.user.findMany({
    where: { role: 'driver', isOnline: true },
    select: { id: true, lastLat: true, lastLng: true },
  });
  return drivers
    .filter((d) => d.lastLat != null && d.lastLng != null)
    .filter((d) => haversineKm(pickup.lat, pickup.lng, d.lastLat, d.lastLng) <= radiusKm)
    .map((d) => d.id);
}

function clearRequestTimer(tripId, emitExpiryToDrivers = false) {
  const entry = requestTimers.get(tripId);
  if (!entry) return;
  clearInterval(entry.interval);
  clearTimeout(entry.timeout);
  requestTimers.delete(tripId);
  if (emitExpiryToDrivers && entry.driverIds.length) {
    relay({ event: 'driver:request-expired', payload: { tripId }, driverIds: entry.driverIds });
  }
}

function startRequestTimer(tripId, driverIds, riderId) {
  let remaining = REQUEST_WINDOW_SECONDS;
  const tick = () => {
    remaining -= 1;
    if (remaining >= 0) {
      relay({
        event: 'driver:incoming-request-tick',
        payload: { tripId, secondsRemaining: remaining },
        driverIds,
      });
    }
  };
  const interval = setInterval(tick, 1000);
  const timeout = setTimeout(async () => {
    clearRequestTimer(tripId);
    try {
      const booking = await prisma.booking.update({
        where: { id: tripId },
        data: { status: 'cancelled' },
      });
      if (booking && booking.status === 'cancelled') {
        await relay({
          event: 'trip:status',
          payload: { tripId, status: 'cancelled', message: 'No driver accepted the ride' },
          riderIds: [riderId],
        });
      }
    } catch (err) {
      // Booking no longer in searching state (accepted meanwhile) — ignore.
      console.error('[trip] expiry update failed:', err.message);
    }
  }, REQUEST_WINDOW_SECONDS * 1000);
  requestTimers.set(tripId, { interval, timeout, driverIds });
}

async function createBooking(userId, { pickup, dropoff, rideType, paymentMethodId }) {
  if (!pickup?.location || !dropoff?.location) throw new HttpError(400, 'Pickup and dropoff are required');
  const ride = RIDE_TYPES.some((r) => r.id === rideType) ? rideType : 'economy';
  const fare = buildFareEstimate(pickup.location, dropoff.location, ride);

  const booking = await prisma.booking.create({
    data: {
      passengerId: userId,
      rideType: ride,
      status: 'searching',
      pickup,
      dropoff,
      fare,
      paymentMethodId: paymentMethodId || null,
      requestExpiresAt: new Date(Date.now() + REQUEST_WINDOW_SECONDS * 1000),
    },
  });

  const driverIds = await findNearbyDriverIds(pickup.location);
  startRequestTimer(booking.id, driverIds, userId);

  if (driverIds.length) {
    await relay({
      event: 'driver:incoming-request',
      payload: {
        tripId: booking.id,
        pickup,
        dropoff,
        pickupLabel: pickup.primary,
        dropoffLabel: dropoff.primary,
        fareTotal: fare.total,
        fare,
        rideType: ride,
        secondsRemaining: REQUEST_WINDOW_SECONDS,
      },
      driverIds,
    });
  }

  return { tripId: booking.id, status: booking.status };
}

async function listTrips(userId, role) {
  const where = role === 'driver' ? { driverId: userId } : { passengerId: userId };
  const bookings = await prisma.booking.findMany({
    where,
    include: tripInclude,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return bookings.map(serializeTrip);
}

async function getActiveTrip(userId) {
  const booking = await prisma.booking.findFirst({
    where: { passengerId: userId, status: { notIn: TERMINAL_STATUSES } },
    include: tripInclude,
    orderBy: { createdAt: 'desc' },
  });
  return booking ? serializeTrip(booking) : null;
}

async function getTripById(tripId, userId, role) {
  const booking = await prisma.booking.findUnique({ where: { id: tripId }, include: tripInclude });
  if (!booking) throw new HttpError(404, 'Trip not found');
  const isParticipant =
    booking.passengerId === userId || (role === 'driver' && booking.driverId === userId);
  if (!isParticipant) throw new HttpError(403, 'Not allowed to view this trip');
  return serializeTrip(booking);
}

async function acceptTrip(tripId, driver) {
  const booking = await prisma.booking.findUnique({ where: { id: tripId } });
  if (!booking) throw new HttpError(404, 'Trip not found');
  if (booking.status !== 'searching') throw new HttpError(409, 'Trip is no longer available');
  if (booking.requestExpiresAt && Date.now() > new Date(booking.requestExpiresAt).getTime()) {
    throw new HttpError(410, 'This request has expired');
  }

  const updated = await prisma.booking.update({
    where: { id: tripId },
    data: { driverId: driver.id, status: 'matched', requestExpiresAt: null },
    include: tripInclude,
  });

  clearRequestTimer(tripId, true);
  await relay({
    event: 'trip:status',
    payload: {
      tripId,
      status: 'matched',
      message: `${driver.firstName} accepted your ride`,
      driver: driverPayload(driver),
    },
    riderIds: [booking.passengerId],
  });

  return { tripId: updated.id, status: updated.status, trip: serializeTrip(updated) };
}

const TRANSITIONS = {
  matched: 'en_route',
  en_route: 'arrived',
  arrived: 'in_progress',
  in_progress: 'completed',
};

const STATUS_MESSAGES = {
  en_route: 'Driver is on the way to your pickup',
  arrived: 'Driver has arrived at your pickup',
  in_progress: 'Your trip is in progress',
  completed: 'Trip completed',
};

async function updateTripStatus(tripId, driverId, nextStatus) {
  const validNext = Object.values(TRANSITIONS);
  if (!validNext.includes(nextStatus)) {
    throw new HttpError(400, `Cannot transition to "${nextStatus}"`);
  }
  const booking = await prisma.booking.findUnique({ where: { id: tripId } });
  if (!booking) throw new HttpError(404, 'Trip not found');
  if (booking.driverId !== driverId) throw new HttpError(403, 'Not the assigned driver');
  if (TRANSITIONS[booking.status] !== nextStatus) {
    throw new HttpError(409, `Cannot move from "${booking.status}" to "${nextStatus}"`);
  }

  const data = { status: nextStatus };
  if (nextStatus === 'in_progress') data.startedAt = new Date();
  if (nextStatus === 'completed') data.completedAt = new Date();

  const updated = await prisma.booking.update({
    where: { id: tripId },
    data,
    include: tripInclude,
  });

  if (nextStatus === 'completed') {
    await prisma.user.update({
      where: { id: driverId },
      data: { totalTrips: { increment: 1 } },
    });
    await relay({ event: 'trip:complete', payload: { tripId }, riderIds: [booking.passengerId] });
  }

  await relay({
    event: 'trip:status',
    payload: {
      tripId,
      status: nextStatus,
      message: STATUS_MESSAGES[nextStatus],
      driver: driverPayload(updated.driver),
    },
    riderIds: [booking.passengerId],
  });

  return { tripId: updated.id, status: updated.status, trip: serializeTrip(updated) };
}

async function cancelTrip(tripId, userId) {
  const booking = await prisma.booking.findUnique({ where: { id: tripId } });
  if (!booking) throw new HttpError(404, 'Trip not found');
  if (booking.passengerId !== userId && booking.driverId !== userId) {
    throw new HttpError(403, 'Not allowed to cancel this trip');
  }
  if (TERMINAL_STATUSES.includes(booking.status)) throw new HttpError(409, 'Trip already ended');

  const updated = await prisma.booking.update({
    where: { id: tripId },
    data: { status: 'cancelled' },
  });

  clearRequestTimer(tripId, true);
  if (booking.driverId) {
    await relay({
      event: 'trip:status',
      payload: { tripId, status: 'cancelled', message: 'Trip was cancelled' },
      driverIds: [booking.driverId],
    });
  }
  return { tripId: updated.id, status: updated.status };
}

async function rateTrip(tripId, userId, { rating, tip, feedback }) {
  const booking = await prisma.booking.findUnique({ where: { id: tripId } });
  if (!booking) throw new HttpError(404, 'Trip not found');
  if (booking.passengerId !== userId) throw new HttpError(403, 'Only the rider can rate a trip');
  if (booking.status !== 'completed') throw new HttpError(409, 'Trip is not completed yet');

  const r = Math.max(1, Math.min(5, Math.round(rating)));
  const t = tip != null ? Math.round(tip * 100) / 100 : null;
  await prisma.booking.update({
    where: { id: tripId },
    data: { rating: r, tip: t, feedback: feedback || null },
  });

  if (booking.driverId) {
    const driverBookings = await prisma.booking.findMany({
      where: { driverId: booking.driverId, status: 'completed', rating: { not: null } },
      select: { rating: true },
    });
    const avg =
      driverBookings.reduce((s, b) => s + b.rating, 0) /
      Math.max(driverBookings.length, 1);
    await prisma.user.update({
      where: { id: booking.driverId },
      data: { rating: Math.round(avg * 100) / 100 },
    });
  }

  return { ok: true };
}

async function computeEarnings(driverId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  const bookings = await prisma.booking.findMany({
    where: { driverId, status: 'completed', completedAt: { gte: start } },
    select: { completedAt: true, fare: true, tip: true },
  });

  const byDay = new Map();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toLocaleDateString('en-US', { weekday: 'short' });
    byDay.set(key, { date: key, trips: 0, earnings: 0, onlineMinutes: 0 });
  }

  for (const b of bookings) {
    if (!b.completedAt) continue;
    const key = b.completedAt.toLocaleDateString('en-US', { weekday: 'short' });
    if (!byDay.has(key)) continue;
    const day = byDay.get(key);
    day.trips += 1;
    day.earnings += (b.fare.total || 0) + (b.tip || 0);
  }

  return Array.from(byDay.values()).map((d) => ({
    ...d,
    earnings: Math.round(d.earnings * 100) / 100,
  }));
}

module.exports = {
  createBooking,
  listTrips,
  getActiveTrip,
  getTripById,
  acceptTrip,
  updateTripStatus,
  cancelTrip,
  rateTrip,
  computeEarnings,
  driverPayload,
  clearRequestTimer,
};