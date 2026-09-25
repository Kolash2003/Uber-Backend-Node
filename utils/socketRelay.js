const { SOCKET_SERVER_URL } = require('../config/constants');

// Dumb relay: forwards events to the socket server which routes to sockets.
async function relay({ event, payload, driverIds = [], riderIds = [] }) {
  try {
    await fetch(`${SOCKET_SERVER_URL}/api/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload, driverIds, riderIds }),
    });
  } catch (err) {
    console.error(`[relay] failed to emit "${event}":`, err.message);
  }
}

module.exports = { relay };