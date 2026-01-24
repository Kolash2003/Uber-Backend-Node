const redisClient = require('../utils/redisClient');


class LocationService {
    async addDriverLocation(driverId, latitude, longitude) {
        try {
            await redisClient.sendCommand([
                'GEOADD',
                `drivers`,
                longitude.toString(),
                latitude.toString(),
                driverId.toString()
            ]);
        } catch (error) {
            console.log("Cannot add redis:", error);
        }
    }
}


module.exports = new LocationService();