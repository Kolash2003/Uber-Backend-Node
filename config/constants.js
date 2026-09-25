const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:4001';

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

const OTP_TTL_SECONDS = 10 * 60;
const DEV_OTP = process.env.DEV_OTP || '123456';
const OTP_ALLOW_ANY = process.env.OTP_ALLOW_ANY === 'true';

// Driver matching
const NEARBY_DRIVER_RADIUS_KM = 15;
const REQUEST_WINDOW_SECONDS = 15;

// Fare pricing
const BASIC_FARE = 2.5;
const RATE_PER_KM = 1.2; // ~1.93 USD/mi
const RATE_PER_MINUTE = 0.35;
const AVERAGE_SPEED_KMH = 32;
const SURGE = 1;
const DISTANCE_SCALE_FACTOR = 1.3; // straight-line -> road distance approximation

const RIDE_TYPES = [
  { id: 'economy', name: 'UberX', capacity: 4, etaMinutes: 3, multiplier: 1, icon: 'car' },
  { id: 'comfort', name: 'Comfort', capacity: 4, etaMinutes: 5, multiplier: 1.25, icon: 'car-front' },
  { id: 'premium', name: 'Premium', capacity: 4, etaMinutes: 7, multiplier: 1.85, icon: 'crown' },
  { id: 'xl', name: 'UberXL', capacity: 6, etaMinutes: 6, multiplier: 1.6, icon: 'truck' },
];

const DEFAULT_VEHICLE = {
  make: 'Toyota',
  model: 'Camry',
  color: 'Silver',
  licensePlate: '8XYZ123',
  year: 2022,
};

const DEFAULT_PLACES = [
  { label: 'Home', primary: '742 Evergreen Terrace', secondary: 'Springfield, OR', lat: 44.0462, lng: -123.022 },
  { label: 'Work', primary: '1 Apple Park Way', secondary: 'Cupertino, CA', lat: 37.3349, lng: -122.009 },
  { label: 'Recent', primary: 'Dolores Park', secondary: 'San Francisco, CA', lat: 37.7599, lng: -122.4269 },
];

const DEFAULT_PAYMENT_METHODS = [
  { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2028, isDefault: true, holderName: null },
  { brand: 'mastercard', last4: '5555', expMonth: 4, expYear: 2027, isDefault: false, holderName: null },
  { brand: 'amex', last4: '0005', expMonth: 9, expYear: 2026, isDefault: false, holderName: null },
];

// Static "geocoder" — an address book of known landmarks (mirrors the frontend mock).
const GEOCODE_PLACES = [
  { label: 'Ferry Building', primary: '1 Ferry Building', secondary: 'San Francisco, CA', location: { lat: 37.7955, lng: -122.3937 } },
  { label: 'Embarcadero Center', primary: 'One Embarcadero Center', secondary: 'San Francisco, CA', location: { lat: 37.7946, lng: -122.3984 } },
  { label: 'Union Square', primary: '333 Post St', secondary: 'San Francisco, CA', location: { lat: 37.788, lng: -122.4074 } },
  { label: 'Pier 39', primary: 'Pier 39', secondary: 'San Francisco, CA', location: { lat: 37.8087, lng: -122.4098 } },
  { label: 'Golden Gate Bridge', primary: 'Golden Gate Bridge', secondary: 'San Francisco, CA', location: { lat: 37.8199, lng: -122.4783 } },
  { label: 'Oracle Park', primary: '24 Willie Mays Plaza', secondary: 'San Francisco, CA', location: { lat: 37.7786, lng: -122.3893 } },
  { label: 'Chase Center', primary: '1 Warriors Way', secondary: 'San Francisco, CA', location: { lat: 37.768, lng: -122.3877 } },
  { label: 'SFO Airport', primary: 'SFO Airport, Terminal 2', secondary: 'San Francisco, CA', location: { lat: 37.6186, lng: -122.3745 } },
  { label: 'Oakland Intl Airport', primary: '1 Airport Dr', secondary: 'Oakland, CA', location: { lat: 37.7128, lng: -122.2195 } },
  { label: 'San Jose Intl Airport', primary: '1701 Airport Blvd', secondary: 'San Jose, CA', location: { lat: 37.3627, lng: -121.9288 } },
  { label: 'Stanford University', primary: '450 Serra Mall', secondary: 'Stanford, CA', location: { lat: 37.4275, lng: -122.1697 } },
  { label: 'Downtown Berkeley', primary: '2160 Shattuck Ave', secondary: 'Berkeley, CA', location: { lat: 37.8715, lng: -122.268 } },
  { label: 'Fishermans Wharf', primary: '495 Jefferson St', secondary: 'San Francisco, CA', location: { lat: 37.808, lng: -122.4177 } },
  { label: 'Market Street', primary: '1455 Market St', secondary: 'San Francisco, CA', location: { lat: 37.7751, lng: -122.4193 } },
  { label: 'Twin Peaks', primary: 'Twin Peaks Blvd', secondary: 'San Francisco, CA', location: { lat: 37.7544, lng: -122.4477 } },
];

module.exports = {
  SOCKET_SERVER_URL,
  JWT_SECRET,
  OTP_TTL_SECONDS,
  DEV_OTP,
  OTP_ALLOW_ANY,
  NEARBY_DRIVER_RADIUS_KM,
  REQUEST_WINDOW_SECONDS,
  BASIC_FARE,
  RATE_PER_KM,
  RATE_PER_MINUTE,
  AVERAGE_SPEED_KMH,
  SURGE,
  DISTANCE_SCALE_FACTOR,
  RIDE_TYPES,
  DEFAULT_VEHICLE,
  DEFAULT_PLACES,
  DEFAULT_PAYMENT_METHODS,
  GEOCODE_PLACES,
};