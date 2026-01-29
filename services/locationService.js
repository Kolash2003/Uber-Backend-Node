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

    async findNearByDrivers(longitude, latitude, radiusKm) {
        const nearbyDrivers = await redisClient.sendCommand([
            'GEORADIUS',
            'drivers',
            longitude.toString(),
            latitude.toString(),
            radiusKm.toString(),
            'km',
            'WITHCOORD',
        ]);

        return nearbyDrivers;
    }

    async setDriverSocket(driverId, socketId) {
        await redisClient.set(`driver:${driverId}`, socketId);
    }

    async getDriverSocket(driverId) {
        return await redisClient.get(`driver:${driverId}`);
    }

    async deleteDriverSocket(driverId) {
        await redisClient.del(`driver:${driverId}`);
    }

    async deleteBySocket(socketId) {
        const driverId = await redisClient.get(socketId);
        await deleteDriverSocket(driverId);
    }

}


module.exports = new LocationService();