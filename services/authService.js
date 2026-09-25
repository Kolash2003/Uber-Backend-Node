const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const { HttpError } = require('../utils/errors');
const {
  JWT_SECRET,
  OTP_TTL_SECONDS,
  DEV_OTP,
  OTP_ALLOW_ANY,
  DEFAULT_PLACES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_VEHICLE,
} = require('../config/constants');

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
  };
}

function issueToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function seedUserDefaults(userId) {
  await prisma.$transaction([
    prisma.savedPlace.createMany({
      data: DEFAULT_PLACES.map((p) => ({ ...p, userId })),
    }),
    prisma.paymentMethod.createMany({
      data: DEFAULT_PAYMENT_METHODS.map((p) => ({ ...p, userId })),
    }),
  ]);
}

async function signup({ firstName, lastName, email, phoneNumber, role, password }) {
  if (!firstName || !lastName) throw new HttpError(400, 'First and last name are required');
  if (!phoneNumber) throw new HttpError(400, 'Phone number is required');

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email || null }, { phoneNumber }].filter((o) => o.email || o.phoneNumber) },
  });
  if (existing) throw new HttpError(409, 'An account with this email or phone already exists');

  const hashed = password ? await bcrypt.hash(password, 10) : null;
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email: email || null,
      phoneNumber,
      password: hashed,
      role: role === 'driver' ? 'driver' : 'rider',
      vehicle: role === 'driver' ? DEFAULT_VEHICLE : undefined,
    },
  });

  await seedUserDefaults(user.id);
  return { token: issueToken(user), user: serializeUser(user) };
}

async function login({ email, password }) {
  if (!email || !password) throw new HttpError(400, 'Email and password are required');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw new HttpError(401, 'Invalid credentials');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new HttpError(401, 'Invalid credentials');
  return { token: issueToken(user), user: serializeUser(user) };
}

async function requestOtp({ phoneNumber }) {
  if (!phoneNumber) throw new HttpError(400, 'Phone number is required');
  const code = generateOtpCode();
  await prisma.otp.create({
    data: { phoneNumber, code, expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000) },
  });
  return { ok: true, devCode: code };
}

async function verifyOtp({ phoneNumber, code }) {
  if (!phoneNumber || !code) throw new HttpError(400, 'Phone number and code are required');

  const user = await prisma.user.findUnique({ where: { phoneNumber } });
  if (!user) throw new HttpError(404, 'No account found for this phone number');

  const stored = await prisma.otp.findFirst({
    where: { phoneNumber, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  const valid =
    (stored && stored.code === code) ||
    (DEV_OTP && code === DEV_OTP) ||
    (OTP_ALLOW_ANY && /^\d{6}$/.test(code));
  if (!valid) throw new HttpError(401, 'Invalid or expired code');

  await prisma.otp.deleteMany({ where: { phoneNumber } });
  return { token: issueToken(user), user: serializeUser(user) };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'Account not found');
  return serializeUser(user);
}

module.exports = { signup, login, requestOtp, verifyOtp, getMe, serializeUser, issueToken };