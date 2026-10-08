import React from 'react';
import { MapPin, Sparkles, ChevronRight, WifiOff } from 'lucide-react';
import { LocationData, PrayerTimesData } from '../types';
import { TabType } from './NavigationShell';

interface HomeScreenProps {
  location: LocationData;
  prayerTimes: PrayerTimesData;
  onOpenCitySelect: () => void;
  onOpenAsk: () => void;
  onOpenPrayerTimes: () => void;
  onOpenOffline: () => void;
  onNavigateTab: (tab: TabType, extra?: { exploreCategory?: 'mosque' | 'halal' }) => void;
  mosqueCountSummary?: string;
  halalCountSummary?: string;
  isOffline?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  location,
  prayerTimes,
  onOpenCitySelect,
  onOpenAsk,
  onOpenPrayerTimes,
  onOpenOffline,
  onNavigateTab,
  mosqueCountSummary = '3 within 1 km',
  halalCountSummary = '12 places nearby',
  isOffline = false,
}) => {
  // Format short date for top right of hero card, e.g. "Thu, 8 Oct"
  const now = new Date();
  const shortDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  // Extract raw hours/mins for timetable row
  const formatTimeOnly = (fullTimeStr: string) => {
    // "4:57 AM" -> "4:57"
    return fullTimeStr.replace(/\s*[AP]M$/i, '');
  };

  return (
    <div className="p-4 sm:p-5 flex flex-col space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="text-xs text-[#5E6E6A] font-medium tracking-tight">Assalamu alaikum</div>
          <button
            onClick={onOpenCitySelect}
            className="flex items-center gap-1.5 text-lg font-bold text-[#14211F] hover:text-[#0F5C4D] transition-colors cursor-pointer group"
          >
            <MapPin className="w-4 h-4 text-[#0F5C4D] shrink-0" />
            <span className="truncate max-w-[200px]">{location.name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#5E6E6A] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Ask Musafir Pill Button */}
        <button
          onClick={onOpenAsk}
          className="py-1.5 px-3.5 rounded-full bg-[#0F5C4D] hover:bg-[#0A4237] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
          <span>Ask</span>
        </button>
      </div>

      {/* Main Hero Card — Next Prayer */}
      <div
        onClick={onOpenPrayerTimes}
        className="w-full bg-[#0F5C4D] rounded-3xl p-5 text-white shadow-md relative overflow-hidden cursor-pointer hover:shadow-lg transition-all"
        role="button"
        tabIndex={0}
        aria-label="View full prayer times"
      >
        {/* Subtle decorative background crescent curve */}
        <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full border border-white/10 pointer-events-none" />

        {/* Top Card Row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/80 font-medium">Next prayer</span>
          <span className="text-[11px] font-medium bg-[#0A4237] text-white/90 px-3 py-1 rounded-full border border-white/5">
            {shortDate}
          </span>
        </div>

        {/* Next Prayer Name */}
        <div className="text-lg font-medium text-white/90">{prayerTimes.nextPrayer}</div>

        {/* Next Prayer Time */}
        <div className="text-4xl font-extrabold tracking-tight text-white my-1">
          {prayerTimes.nextPrayerTime}
        </div>

        {/* Countdown Pill Badge */}
        <div className="inline-block mb-5">
          <span className="bg-[#C9A24B] text-[#14211F] text-xs font-bold px-3 py-1 rounded-full shadow-xs">
            {prayerTimes.timeRemaining}
          </span>
        </div>

        {/* Today's Prayer Times Strip */}
        <div className="w-full bg-[#0A4237] rounded-2xl p-2.5 flex items-center justify-between text-center border border-white/5">
          {/* Fajr */}
          <div
            className={`flex-1 py-1 px-1 rounded-xl transition-all ${
              prayerTimes.nextPrayer === 'Fajr'
                ? 'bg-[#C9A24B] text-[#14211F]'
                : 'text-white'
            }`}
          >
            <div className={`text-[11px] ${prayerTimes.nextPrayer === 'Fajr' ? 'font-bold' : 'text-white/70'}`}>
              Fajr
            </div>
            <div className={`text-xs ${prayerTimes.nextPrayer === 'Fajr' ? 'font-extrabold' : 'font-semibold'}`}>
              {formatTimeOnly(prayerTimes.fajr)}
            </div>
          </div>

          {/* Dhuhr */}
          <div
            className={`flex-1 py-1 px-1 rounded-xl transition-all ${
              prayerTimes.nextPrayer === 'Dhuhr'
                ? 'bg-[#C9A24B] text-[#14211F]'
                : 'text-white'
            }`}
          >
            <div className={`text-[11px] ${prayerTimes.nextPrayer === 'Dhuhr' ? 'font-bold' : 'text-white/70'}`}>
              Dhuhr
            </div>
            <div className={`text-xs ${prayerTimes.nextPrayer === 'Dhuhr' ? 'font-extrabold' : 'font-semibold'}`}>
              {formatTimeOnly(prayerTimes.dhuhr)}
            </div>
          </div>

          {/* Asr */}
          <div
            className={`flex-1 py-1 px-1 rounded-xl transition-all ${
              prayerTimes.nextPrayer === 'Asr'
                ? 'bg-[#C9A24B] text-[#14211F]'
                : 'text-white'
            }`}
          >
            <div className={`text-[11px] ${prayerTimes.nextPrayer === 'Asr' ? 'font-bold' : 'text-white/70'}`}>
              Asr
            </div>
            <div className={`text-xs ${prayerTimes.nextPrayer === 'Asr' ? 'font-extrabold' : 'font-semibold'}`}>
              {formatTimeOnly(prayerTimes.asr)}
            </div>
          </div>

          {/* Maghrib */}
          <div
            className={`flex-1 py-1 px-1 rounded-xl transition-all ${
              prayerTimes.nextPrayer === 'Maghrib'
                ? 'bg-[#C9A24B] text-[#14211F]'
                : 'text-white'
            }`}
          >
            <div className={`text-[11px] ${prayerTimes.nextPrayer === 'Maghrib' ? 'font-bold' : 'text-white/70'}`}>
              Maghrib
            </div>
            <div className={`text-xs ${prayerTimes.nextPrayer === 'Maghrib' ? 'font-extrabold' : 'font-semibold'}`}>
              {formatTimeOnly(prayerTimes.maghrib)}
            </div>
          </div>

          {/* Isha */}
          <div
            className={`flex-1 py-1 px-1 rounded-xl transition-all ${
              prayerTimes.nextPrayer === 'Isha'
                ? 'bg-[#C9A24B] text-[#14211F]'
                : 'text-white'
            }`}
          >
            <div className={`text-[11px] ${prayerTimes.nextPrayer === 'Isha' ? 'font-bold' : 'text-white/70'}`}>
              Isha
            </div>
            <div className={`text-xs ${prayerTimes.nextPrayer === 'Isha' ? 'font-extrabold' : 'font-semibold'}`}>
              {formatTimeOnly(prayerTimes.isha)}
            </div>
          </div>
        </div>
      </div>

      {/* Section: WHAT DO YOU NEED? */}
      <div>
        <h2 className="text-base font-bold text-[#14211F] mb-3 px-0.5">What do you need?</h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Find Qibla */}
          <button
            onClick={() => onNavigateTab('qibla')}
            className="p-4 bg-white rounded-2xl border border-[#E4E8E5] hover:border-[#0F5C4D]/40 text-left transition-all hover:shadow-xs cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D] mb-3 group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-[#0F5C4D]"
              >
                <polygon points="12 2 19 21 12 17 5 21 12 2" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-[#14211F]">Find Qibla</div>
              <div className="text-xs text-[#5E6E6A]">Point to Makkah</div>
            </div>
          </button>

          {/* Card 2: Mosques */}
          <button
            onClick={() => onNavigateTab('explore', { exploreCategory: 'mosque' })}
            className="p-4 bg-white rounded-2xl border border-[#E4E8E5] hover:border-[#0F5C4D]/40 text-left transition-all hover:shadow-xs cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D] mb-3 group-hover:scale-105 transition-transform">
              <svg
                className="w-5 h-5 text-[#0F5C4D] fill-current"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-[#14211F]">Mosques</div>
              <div className="text-xs text-[#5E6E6A]">{mosqueCountSummary}</div>
            </div>
          </button>

          {/* Card 3: Halal food */}
          <button
            onClick={() => onNavigateTab('explore', { exploreCategory: 'halal' })}
            className="p-4 bg-white rounded-2xl border border-[#E4E8E5] hover:border-[#0F5C4D]/40 text-left transition-all hover:shadow-xs cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D] mb-3 group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-[#0F5C4D]"
              >
                <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                <path d="M15 11v11" />
                <path d="M6 2v20" />
                <path d="M6 7h4a2 2 0 0 0 2-2V2" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-[#14211F]">Halal food</div>
              <div className="text-xs text-[#5E6E6A]">{halalCountSummary}</div>
            </div>
          </button>

          {/* Card 4: Plan trip */}
          <button
            onClick={() => onNavigateTab('trip')}
            className="p-4 bg-white rounded-2xl border border-[#E4E8E5] hover:border-[#0F5C4D]/40 text-left transition-all hover:shadow-xs cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E3F1ED] flex items-center justify-center text-[#0F5C4D] mb-3 group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-[#0F5C4D]"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-[#14211F]">Plan trip</div>
              <div className="text-xs text-[#5E6E6A]">Day 1 ready</div>
            </div>
          </button>
        </div>
      </div>

      {/* Offline Ready Banner */}
      <button
        onClick={onOpenOffline}
        className="w-full p-4 rounded-2xl bg-[#FBF3DE] border border-[#E4E8E5] hover:border-[#C9A24B]/40 flex items-center justify-between text-left transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/20 flex items-center justify-center shrink-0 text-[#C9A24B]">
            <WifiOff className="w-5 h-5 text-[#C9A24B]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#14211F]">Offline ready</div>
            <div className="text-xs text-[#5E6E6A]">{location.name.split(',')[0]} saved on this phone</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#5E6E6A] group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};
