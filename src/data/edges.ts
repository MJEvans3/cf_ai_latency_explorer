// Major Cloudflare data centers with coordinates
// Source: https://www.cloudflare.com/network/

export interface EdgeLocation {
  code: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export const EDGE_LOCATIONS: EdgeLocation[] = [
  // North America
  { code: "SJC", city: "San Jose", country: "US", lat: 37.36, lng: -121.93 },
  { code: "LAX", city: "Los Angeles", country: "US", lat: 33.94, lng: -118.41 },
  { code: "SEA", city: "Seattle", country: "US", lat: 47.45, lng: -122.31 },
  { code: "ORD", city: "Chicago", country: "US", lat: 41.97, lng: -87.91 },
  { code: "IAD", city: "Washington DC", country: "US", lat: 38.95, lng: -77.46 },
  { code: "EWR", city: "Newark", country: "US", lat: 40.69, lng: -74.17 },
  { code: "MIA", city: "Miami", country: "US", lat: 25.80, lng: -80.29 },
  { code: "DFW", city: "Dallas", country: "US", lat: 32.90, lng: -97.04 },
  { code: "ATL", city: "Atlanta", country: "US", lat: 33.64, lng: -84.43 },
  { code: "DEN", city: "Denver", country: "US", lat: 39.86, lng: -104.67 },
  { code: "PHX", city: "Phoenix", country: "US", lat: 33.43, lng: -112.01 },
  { code: "YYZ", city: "Toronto", country: "CA", lat: 43.68, lng: -79.63 },
  { code: "YVR", city: "Vancouver", country: "CA", lat: 49.19, lng: -123.18 },
  { code: "MEX", city: "Mexico City", country: "MX", lat: 19.44, lng: -99.07 },

  // Europe
  { code: "LHR", city: "London", country: "GB", lat: 51.47, lng: -0.45 },
  { code: "AMS", city: "Amsterdam", country: "NL", lat: 52.31, lng: 4.77 },
  { code: "FRA", city: "Frankfurt", country: "DE", lat: 50.04, lng: 8.56 },
  { code: "CDG", city: "Paris", country: "FR", lat: 49.01, lng: 2.55 },
  { code: "MAD", city: "Madrid", country: "ES", lat: 40.47, lng: -3.56 },
  { code: "MXP", city: "Milan", country: "IT", lat: 45.63, lng: 8.72 },
  { code: "ZRH", city: "Zurich", country: "CH", lat: 47.46, lng: 8.56 },
  { code: "VIE", city: "Vienna", country: "AT", lat: 48.11, lng: 16.57 },
  { code: "WAW", city: "Warsaw", country: "PL", lat: 52.17, lng: 20.97 },
  { code: "ARN", city: "Stockholm", country: "SE", lat: 59.65, lng: 17.95 },
  { code: "HEL", city: "Helsinki", country: "FI", lat: 60.32, lng: 24.96 },
  { code: "DUB", city: "Dublin", country: "IE", lat: 53.43, lng: -6.25 },

  // Asia Pacific
  { code: "NRT", city: "Tokyo", country: "JP", lat: 35.77, lng: 140.39 },
  { code: "HND", city: "Tokyo Haneda", country: "JP", lat: 35.55, lng: 139.78 },
  { code: "SIN", city: "Singapore", country: "SG", lat: 1.36, lng: 103.99 },
  { code: "HKG", city: "Hong Kong", country: "HK", lat: 22.31, lng: 113.92 },
  { code: "ICN", city: "Seoul", country: "KR", lat: 37.46, lng: 126.44 },
  { code: "SYD", city: "Sydney", country: "AU", lat: -33.94, lng: 151.18 },
  { code: "MEL", city: "Melbourne", country: "AU", lat: -37.67, lng: 144.84 },
  { code: "BOM", city: "Mumbai", country: "IN", lat: 19.09, lng: 72.87 },
  { code: "DEL", city: "New Delhi", country: "IN", lat: 28.56, lng: 77.10 },
  { code: "BKK", city: "Bangkok", country: "TH", lat: 13.69, lng: 100.75 },
  { code: "KUL", city: "Kuala Lumpur", country: "MY", lat: 2.75, lng: 101.71 },
  { code: "CGK", city: "Jakarta", country: "ID", lat: -6.13, lng: 106.66 },
  { code: "MNL", city: "Manila", country: "PH", lat: 14.51, lng: 121.02 },
  { code: "TPE", city: "Taipei", country: "TW", lat: 25.08, lng: 121.23 },

  // South America
  { code: "GRU", city: "Sao Paulo", country: "BR", lat: -23.44, lng: -46.47 },
  { code: "GIG", city: "Rio de Janeiro", country: "BR", lat: -22.81, lng: -43.25 },
  { code: "EZE", city: "Buenos Aires", country: "AR", lat: -34.82, lng: -58.54 },
  { code: "SCL", city: "Santiago", country: "CL", lat: -33.39, lng: -70.79 },
  { code: "BOG", city: "Bogota", country: "CO", lat: 4.70, lng: -74.15 },
  { code: "LIM", city: "Lima", country: "PE", lat: -12.02, lng: -77.11 },

  // Africa & Middle East
  { code: "JNB", city: "Johannesburg", country: "ZA", lat: -26.14, lng: 28.24 },
  { code: "CPT", city: "Cape Town", country: "ZA", lat: -33.97, lng: 18.60 },
  { code: "DXB", city: "Dubai", country: "AE", lat: 25.25, lng: 55.36 },
  { code: "TLV", city: "Tel Aviv", country: "IL", lat: 32.01, lng: 34.89 },
  { code: "CAI", city: "Cairo", country: "EG", lat: 30.11, lng: 31.40 },
  { code: "NBO", city: "Nairobi", country: "KE", lat: -1.32, lng: 36.93 },
  { code: "LOS", city: "Lagos", country: "NG", lat: 6.58, lng: 3.32 },
];

// Find the nearest edge location to given coordinates
export function findNearestEdge(lat: number, lng: number): EdgeLocation {
  let nearest = EDGE_LOCATIONS[0];
  let minDist = Infinity;

  for (const edge of EDGE_LOCATIONS) {
    const dist = haversineDistance(lat, lng, edge.lat, edge.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = edge;
    }
  }

  return nearest;
}

// Calculate distance between two points using Haversine formula
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Get edge location by code
export function getEdgeByCode(code: string): EdgeLocation | undefined {
  return EDGE_LOCATIONS.find((e) => e.code === code);
}
