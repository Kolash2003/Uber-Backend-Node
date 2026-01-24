const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { updateLocation } = require("../controllers/driverController");

const router = express.Router();

router.post('/location', authMiddleware, updateLocation);

module.exports = router;