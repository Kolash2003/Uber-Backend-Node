const { GEOCODE_PLACES } = require('../config/constants');

// "Geocode" the user's free-text search against the known placebook.
function geocode(query) {
  const q = (query || '').trim().toLowerCase();
  const results = GEOCODE_PLACES.filter((p) => {
    if (!q) return true;
    const haystack = `${p.label} ${p.primary} ${p.secondary}`.toLowerCase();
    return haystack.includes(q);
  }).map((p, i) => ({
    id: `geo_${i}`,
    label: p.label,
    primary: p.primary,
    secondary: p.secondary,
    location: p.location,
  }));
  return results.slice(0, 8);
}

module.exports = { geocode };