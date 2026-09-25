const { asyncHandler } = require('../utils/errors');
const authService = require('../services/authService');

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

const requestOtp = asyncHandler(async (req, res) => {
  const result = await authService.requestOtp(req.body);
  res.json(result);
});

const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.body);
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  res.json(await authService.getMe(req.userId));
});

module.exports = { signup, login, requestOtp, verifyOtp, me };