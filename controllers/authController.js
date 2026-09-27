const { asyncHandler } = require('../utils/errors');
const authService = require('../services/authService');

const me = asyncHandler(async (req, res) => {
  res.json(await authService.getMe(req.userId));
});

module.exports = { me };
