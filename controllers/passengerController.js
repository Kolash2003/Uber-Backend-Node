const bookingService = require('../services/bookingService');

const createBooking = async (req, res) => {
    try {
        const { source, destination } = req.body;
        // create a booking > persist a booking object in mongodb
        const booking = await bookingService.createBooking({ userId: req.user._id, source, destination });

        // find nearby drivers >> using redisdb

        // notify the nearby drivers >> using socket.io

        res.status(201).send({
            data: booking,
            success: true,
            error: null,
            message: 'Booking created successfully'
        })
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
}

module.exports = { createBooking };