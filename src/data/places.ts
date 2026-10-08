import { Place } from '../types';

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export const DUBAI_PLACES: Place[] = [
  // Mosques
  {
    id: 'mosque-1',
    name: 'Jumeirah Mosque',
    category: 'mosque',
    distance: '350 m',
    distanceMeters: 350,
    timeInfo: '5 min walk',
    isOpen: true,
    statusText: 'Open now',
    tags: ['Wudu area', 'Guided visits', 'Iconic stone architecture'],
    lat: 25.2341,
    lng: 55.2608,
    address: 'Jumeirah Beach Road, Jumeirah 1, Dubai',
    rating: 4.8,
    googleMapsUri: 'https://maps.google.com/?q=Jumeirah+Mosque+Dubai',
    description: 'One of the most photographed mosques in Dubai, welcoming visitors with serene white stone minarets and clean, spacious wudu facilities.',
    isReal: false,
  },
  {
    id: 'mosque-2',
    name: 'Al Satwa Mosque',
    category: 'mosque',
    distance: '800 m',
    distanceMeters: 800,
    timeInfo: '11 min walk',
    isOpen: true,
    statusText: 'Open now',
    tags: ["Women's section", 'Car parking', 'Quiet community atmosphere'],
    lat: 25.2255,
    lng: 55.2711,
    address: 'Al Satwa Road, Dubai',
    rating: 4.7,
    googleMapsUri: 'https://maps.google.com/?q=Al+Satwa+Mosque+Dubai',
    description: 'Active community mosque with dedicated ladies prayer hall, accessible entrance, and tranquil atmosphere.',
    isReal: false,
  },
  {
    id: 'mosque-3',
    name: 'Grand Mosque',
    category: 'mosque',
    distance: '1.3 km',
    distanceMeters: 1300,
    timeInfo: '6 min drive',
    isOpen: true,
    statusText: 'Open now',
    tags: ['Parking', 'Historic minaret', 'Quran school'],
    lat: 25.2633,
    lng: 55.2972,
    address: 'Ali Bin Abi Taleb St, Bur Dubai, Dubai',
    rating: 4.9,
    googleMapsUri: 'https://maps.google.com/?q=Grand+Mosque+Bur+Dubai',
    description: 'Historic mosque hub with 70m minaret and capacity for 1,200 worshippers, located in the cultural heart of Bur Dubai.',
    isReal: false,
  },
  {
    id: 'mosque-4',
    name: 'Al Farooq Omar Bin Al Khattab Mosque',
    category: 'mosque',
    distance: '2.2 km',
    distanceMeters: 2200,
    timeInfo: '8 min drive',
    isOpen: true,
    statusText: 'Open now',
    tags: ['Blue Mosque inspired', 'Extensive library', 'Wheelchair accessible'],
    lat: 25.1764,
    lng: 55.2386,
    address: 'Al Safa 1, Dubai',
    rating: 4.9,
    googleMapsUri: 'https://maps.google.com/?q=Al+Farooq+Omar+Bin+Al+Khattab+Mosque+Dubai',
    description: 'Renowned as the Blue Mosque of Dubai with exquisite Ottoman-Andalusian architectural design.',
    isReal: false,
  },

  // Halal food
  {
    id: 'halal-1',
    name: 'Al Mandi House',
    category: 'halal',
    distance: '250 m',
    distanceMeters: 250,
    timeInfo: '3 min walk',
    isOpen: true,
    statusText: 'Open now',
    tags: ['Halal certified', 'Traditional floor seating', 'Lamb Madhbi'],
    lat: 25.2075,
    lng: 55.2731,
    address: 'Al Hudaiba St, Dubai',
    rating: 4.7,
    googleMapsUri: 'https://maps.google.com/?q=Al+Mandi+House+Dubai',
    halalStatus: 'certified',
    description: 'Beloved local kitchen famous for fragrant spiced rice and tender slow-roasted lamb mandi, 100% Halal certified.',
    isReal: false,
  },
  {
    id: 'halal-2',
    name: 'Beirut Grill',
    category: 'halal',
    distance: '600 m',
    distanceMeters: 600,
    timeInfo: '8 min walk',
    isOpen: true,
    statusText: 'Open now',
    tags: ['Family seating', 'Mezze platters', 'Fresh baked bread'],
    lat: 25.2112,
    lng: 55.2685,
    address: 'Jumeirah Road, Dubai',
    rating: 4.6,
    googleMapsUri: 'https://maps.google.com/?q=Beirut+Grill+Dubai',
    halalStatus: 'reported',
    description: 'Fresh Lebanese charcoal grills, cold mezze, fresh pomegranate salads, and spacious family-friendly tables.',
    isReal: false,
  },
  {
    id: 'halal-3',
    name: 'Spice Garden',
    category: 'halal',
    distance: '1.1 km',
    distanceMeters: 1100,
    timeInfo: '5 min drive',
    isOpen: true,
    statusText: 'Open now',
    tags: ['Takeaway', 'Hyderabadi Biryani', 'Fast service'],
    lat: 25.2189,
    lng: 55.2798,
    address: 'Al Wasl Road, Dubai',
    rating: 4.5,
    googleMapsUri: 'https://maps.google.com/?q=Spice+Garden+Dubai',
    halalStatus: 'reported',
    description: 'Aromatic authentic biryanis, curries, and kebabs with generous portions and quick takeaway counter.',
    isReal: false,
  },
  {
    id: 'halal-4',
    name: 'Arabian Tea House',
    category: 'halal',
    distance: '1.8 km',
    distanceMeters: 1800,
    timeInfo: '7 min drive',
    isOpen: true,
    statusText: 'Open now',
    tags: ['Historic courtyard', 'Emirati breakfast', 'Karak tea'],
    lat: 25.2635,
    lng: 55.3005,
    address: 'Al Fahidi Historical Neighbourhood, Bur Dubai',
    rating: 4.8,
    googleMapsUri: 'https://maps.google.com/?q=Arabian+Tea+House+Dubai',
    halalStatus: 'certified',
    description: 'Charming turquoise-cushioned courtyard restaurant serving heritage Emirati feasts and sweet cardamom karak tea.',
    isReal: false,
  },
];

export function getPlacesForLocation(locationId: string): Place[] {
  return DUBAI_PLACES;
}
