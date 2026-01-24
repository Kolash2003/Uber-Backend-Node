const driverService = require('../services/driverService');

const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (typeof latitude != 'number' || typeof longitude != 'number') {
            throw new Error('latitude and longitude must benumbers');
        }

        await driverService.updateLocation(req.user._id, { latitude, longitude });
        res.status(201).send({
            success: true,
            error: null,
            message: 'Location updated for driver'
        });

    } catch (error) {
        res.status(400).send({
            error: error.message
        });
    }
}


module.exports = { updateLocation };