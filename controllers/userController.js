const { asyncHandler, HttpError } = require('../utils/errors');
const prisma = require('../prisma/client');
const tripService = require('../services/tripService');
const authService = require('../services/authService');
const { DEFAULT_PLACES, DEFAULT_PAYMENT_METHODS } = require('../config/constants');

// Accounts are created by Better Auth in the frontend, so seed the demo
// saved places / payment methods lazily the first time they're requested.
async function ensureUserDefaults(userId) {
  const [placeCount, methodCount] = await Promise.all([
    prisma.savedPlace.count({ where: { userId } }),
    prisma.paymentMethod.count({ where: { userId } }),
  ]);
  if (placeCount === 0) {
    await prisma.savedPlace.createMany({
      data: DEFAULT_PLACES.map((p) => ({ ...p, userId })),
    });
  }
  if (methodCount === 0) {
    await prisma.paymentMethod.createMany({
      data: DEFAULT_PAYMENT_METHODS.map((p) => ({ ...p, userId })),
    });
  }
}

const savedPlaces = asyncHandler(async (req, res) => {
  await ensureUserDefaults(req.userId);
  const places = await prisma.savedPlace.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(
    places.map((p) => ({
      id: p.id,
      label: p.label,
      primary: p.primary,
      secondary: p.secondary || '',
      location: { lat: p.lat, lng: p.lng },
    }))
  );
});

const paymentMethods = asyncHandler(async (req, res) => {
  await ensureUserDefaults(req.userId);
  const methods = await prisma.paymentMethod.findMany({
    where: { userId: req.userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  res.json(
    methods.map((m) => ({
      id: m.id,
      brand: m.brand,
      last4: m.last4,
      expMonth: m.expMonth,
      expYear: m.expYear,
      isDefault: m.isDefault,
      holderName: m.holderName || undefined,
    }))
  );
});

const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, address } = req.body ?? {};

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new HttpError(400, 'latitude and longitude must be valid numbers');
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      lastLat: latitude,
      lastLng: longitude,
      ...(typeof address === 'string' && address.trim()
        ? { lastAddress: address.trim() }
        : {}),
      locationUpdatedAt: new Date(),
    },
  });

  res.json(authService.serializeUser(user));
});

const earnings = asyncHandler(async (req, res) => {
  res.json(await tripService.computeEarnings(req.userId));
});

module.exports = { savedPlaces, paymentMethods, updateLocation, earnings };