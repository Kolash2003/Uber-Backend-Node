const { asyncHandler } = require('../utils/errors');
const driverService = require('../services/driverService');

const updateLocation = asyncHandler(async (req, res) => {
  res.json(await driverService.updateLocation(req.userId, req.body));
});

const setOnline = asyncHandler(async (req, res) => {
  res.json(await driverService.setOnline(req.userId, req.body.online));
});

module.exports = { updateLocation, setOnline };