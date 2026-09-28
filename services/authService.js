const prisma = require('../prisma/client');
const { HttpError } = require('../utils/errors');

function serializeUser(user) {
  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    photoUrl: user.photoUrl,
    role: user.role,
    rating: user.rating,
    totalTrips: user.totalTrips,
    vehicle: user.vehicle ?? null,
    lastLat: user.lastLat ?? null,
    lastLng: user.lastLng ?? null,
    lastAddress: user.lastAddress ?? null,
    hasLocation: user.lastLat != null && user.lastLng != null,
  };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'Account not found');
  return serializeUser(user);
}

module.exports = { getMe, serializeUser };
