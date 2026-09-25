const { asyncHandler } = require('../utils/errors');
const prisma = require('../prisma/client');
const tripService = require('../services/tripService');

const savedPlaces = asyncHandler(async (req, res) => {
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