const bookingRepository = require('../repositories/bookingRepository');
const { haversineDistance } = require('../utils/distance');
const locationService = require('./locationService');

const BASIC_FARE = 50;
const RATE_PER_KM = 12;

const createBooking = async ({ passengerId, source, destination }) => {

    const distance = haversineDistance(source.latitude, source.longitude, destination.latitude, destination.longitude);
    const fare = BASIC_FARE + (distance * RATE_PER_KM);
    const bookingData = {
        passenger: passengerId,
        source,
        destination,
        fare,
        status: 'pending',
        distance,
    }

    const booking = await bookingRepository.createBooking(bookingData);
    return booking;
}

const findNearbyDrivers = async (location, radius = 5) => {
    const longitude = parseFloat(location.longitude);
    const latitude = parseFloat(location.latitude);

    const radiusKm = parseFloat(radius);

    const nearbyDrivers = await locationService.findNearByDrivers(longitude, latitude, radiusKm);
    return nearbyDrivers;
}


module.exports = { createBooking, findNearbyDrivers };