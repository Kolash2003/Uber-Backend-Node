const locationService = require('../services/locationService');
const userRepository = require('../repositories/userRepository');

const updateLocation = async (driverId, { latitude, longitude }) => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    try {
        // update driver location in redis
        const res = await locationService.addDriverLocation(driverId, lat, lon);
        // update driver location in mongodb
        await userRepository.updateLocation(driverId, {
            type: 'Point',
            coordinates: [lon, lat] // redis expects you to send lon first
        });
    } catch (error) {
        console.log(error);
    }

    // update driver location in mongodb
}

module.exports = { updateLocation };
