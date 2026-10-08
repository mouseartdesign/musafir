export interface LocationData {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface PrayerTimesData {
  date: string;
  readableDate: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  fajrRaw: Date;
  sunriseRaw: Date;
  dhuhrRaw: Date;
  asrRaw: Date;
  maghribRaw: Date;
  ishaRaw: Date;
  nextPrayer: PrayerName;
  nextPrayerTime: string;
  timeRemaining: string; // e.g. "in 1 h 04 min"
  isTomorrow?: boolean;
}

export interface Place {
  id: string;
  name: string;
  category: 'mosque' | 'halal';
  distance: string; // e.g. "350 m"
  distanceMeters: number;
  timeInfo: string; // e.g. "5 min walk" or "6 min drive"
  isOpen: boolean;
  statusText: string; // "Open now" or "Closed"
  tags: string[]; // ["Wudu area", "Halal restaurant", "Women's section"]
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  description?: string;
  googleMapsUri?: string;
  phone?: string;
  website?: string;
  halalStatus?: 'certified' | 'reported' | 'halal_menu' | 'none';
  isReal?: boolean;
}

export interface TripStop {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  type: 'sightseeing' | 'prayer' | 'food' | 'freetime';
  distance?: string;
}

export interface TripDay {
  dayNumber: number;
  title: string;
  stops: TripStop[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  card?: {
    type: 'mosque' | 'food';
    title: string;
    subtitle: string;
    place?: Place;
    googleMapsUri?: string;
    distance?: string;
    statusText?: string;
  };
  actions?: string[];
}
