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

export type TripStopType = 'sightseeing' | 'prayer' | 'food' | 'freetime' | 'travel';
export type TripStopStatus = 'upcoming' | 'active' | 'completed' | 'skipped';

export interface TripStop {
  id: string;
  time: string;
  durationMinutes?: number;
  title: string;
  subtitle: string;
  type: TripStopType;
  distance?: string;
  distanceMeters?: number;
  travelTime?: string;
  status?: TripStopStatus;
  lat?: number;
  lng?: number;
  address?: string;
  googleMapsUri?: string;
  notes?: string;
  prayerName?: PrayerName;
  halalStatus?: string;
}

export interface TripDay {
  dayNumber: number;
  title: string;
  dateStr?: string;
  theme?: string;
  stops: TripStop[];
}

export interface TripPreferences {
  destination: {
    name: string;
    formattedAddress?: string;
    lat: number;
    lng: number;
    country?: string;
  };
  startingLocation: string;
  startDate: string;
  durationDays: number;
  dailyStartTime: string;
  travelStyle: 'relaxed' | 'moderate' | 'fast-paced' | 'walking-friendly';
  interests: string[];
}

export interface TripGuide {
  id: string;
  destination: TripPreferences['destination'];
  preferences: TripPreferences;
  days: TripDay[];
  activeDayNumber: number;
  isGenerating?: boolean;
  lastUpdatedAt: string;
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
  tripAction?: {
    action: 'updated' | 're-planned' | 'delayed' | 'skipped' | 'added';
    description: string;
    dayNumber?: number;
  };
  actions?: string[];
}
