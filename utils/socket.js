const locationService = require('../services/locationService');


function initSocket(io) {
    io.on('connection', (socket) => {
        console.log(`New socket connected, ${socket.id}`);

        // Register the driver with socketId
        socket.on('registerDriver', async (driverId) => {
            if (!driverId) return;
            await locationService.setDriverSocket(driverId, socket.id);
            console.log(`Driver ${driverId} registered with socketId ${socket.id}`);
        });

        socket.on('disconnect', async () => {
            const driverId = await locationService.deleteBySocket(socket.id);
            console.log(`Socket ${socket.id} disconnected ${driverId}`);
        });
    });
}

module.exports = { initSocket };