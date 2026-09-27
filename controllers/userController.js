const { asyncHandler } = require('../utils/errors');
const prisma = require('../prisma/client');
const tripService = require('../services/tripService');
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

const earnings = asyncHandler(async (req, res) => {
  res.json(await tripService.computeEarnings(req.userId));
});

module.exports = { savedPlaces, paymentMethods, earnings };