import { LocationData, TripDay, TripGuide } from '../types';
import { DEFAULT_LOCATION } from '../data/cities';
import { INITIAL_TRIP_DAYS, INITIAL_TRIP_GUIDE } from '../data/trips';

const STORAGE_KEYS = {
  HAS_ONBOARDED: 'musafir_has_onboarded',
  SELECTED_LOCATION: 'musafir_selected_location',
  CALCULATION_METHOD: 'musafir_calc_method',
  ADHAN_REMINDER_ENABLED: 'musafir_adhan_enabled',
  PRAYER_NOTIFICATIONS: 'musafir_prayer_notifs',
  OFFLINE_PACK_DATE: 'musafir_offline_pack_date',
  TRIP_DAYS: 'musafir_trip_days',
  TRIP_GUIDE: 'musafir_trip_guide_active',
};

export interface OfflinePackMeta {
  cityName: string;
  isReady: boolean;
  lastUpdated: string;
  compassStatus: string;
  prayerDaysSaved: number;
  mosqueSizeMb: number;
  halalSizeMb: number;
}

export function getHasOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED) === 'true';
  } catch {
    return false;
  }
}

export function setHasOnboarded(val: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, String(val));
  } catch {}
}

export function getSavedLocation(): LocationData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_LOCATION);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_LOCATION;
}

export function saveLocation(location: LocationData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_LOCATION, JSON.stringify(location));
  } catch {}
}

export function getCalculationMethod(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.CALCULATION_METHOD) || 'MWL';
  } catch {
    return 'MWL';
  }
}

export function saveCalculationMethod(method: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CALCULATION_METHOD, method);
  } catch {}
}

export function getAdhanReminderEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ADHAN_REMINDER_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function saveAdhanReminderEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADHAN_REMINDER_ENABLED, String(enabled));
  } catch {}
}

export function getPrayerNotifications(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRAYER_NOTIFICATIONS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    Fajr: true,
    Sunrise: false,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  };
}

export function savePrayerNotifications(notifs: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRAYER_NOTIFICATIONS, JSON.stringify(notifs));
  } catch {}
}

export function getOfflinePackMeta(cityName: string): OfflinePackMeta {
  try {
    const lastDate = localStorage.getItem(STORAGE_KEYS.OFFLINE_PACK_DATE) || 'today, 9:20 AM';
    return {
      cityName: cityName || 'Dubai',
      isReady: true,
      lastUpdated: lastDate,
      compassStatus: 'Works without internet',
      prayerDaysSaved: 30,
      mosqueSizeMb: 24,
      halalSizeMb: 8,
    };
  } catch {
    return {
      cityName: 'Dubai',
      isReady: true,
      lastUpdated: 'today, 9:20 AM',
      compassStatus: 'Works without internet',
      prayerDaysSaved: 30,
      mosqueSizeMb: 24,
      halalSizeMb: 8,
    };
  }
}

export function updateOfflinePackMeta(): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const str = `today, ${timeStr}`;
  try {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_PACK_DATE, str);
  } catch {}
  return str;
}

export function getTripDays(): TripDay[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRIP_DAYS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_TRIP_DAYS;
}

export function saveTripDays(days: TripDay[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRIP_DAYS, JSON.stringify(days));
  } catch {}
}

export function getTripGuide(): TripGuide | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRIP_GUIDE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.destination && Array.isArray(parsed.days) && parsed.days.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

export function saveTripGuide(guide: TripGuide): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRIP_GUIDE, JSON.stringify(guide));
    if (guide.days) {
      saveTripDays(guide.days);
    }
  } catch {}
}

export function clearTripGuide(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRIP_GUIDE);
    localStorage.removeItem(STORAGE_KEYS.TRIP_DAYS);
  } catch {}
}

