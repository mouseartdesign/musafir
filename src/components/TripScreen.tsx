import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Check,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Navigation,
  ExternalLink,
  AlertCircle,
  Calendar,
  Compass,
  Search,
  CheckCircle2,
  FastForward,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  Coffee,
  Utensils,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import { LocationData, TripGuide, TripDay, TripStop, TripStopType, PrayerTimesData } from '../types';
import { AddStopModal } from './AddStopModal';
import { POPULAR_CITIES } from '../data/cities';

interface TripScreenProps {
  location: LocationData;
  tripGuide?: TripGuide | null;
  onUpdateTripGuide: (updated: TripGuide) => void;
  onResetTripGuide?: () => void;
  onOpenAsk: () => void;
  prayerTimes: PrayerTimesData;
  userCoords?: { lat: number; lng: number };
}

// Distance helper
function calcHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
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

function formatDist(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export const TripScreen: React.FC<TripScreenProps> = ({
  location,
  tripGuide,
  onUpdateTripGuide,
  onResetTripGuide,
  onOpenAsk,
  prayerTimes,
  userCoords,
}) => {
  // Mode: 'companion' (active trip timeline) or 'setup' (destination & details flow)
  const [viewMode, setViewMode] = useState<'companion' | 'setup-destination' | 'setup-details'>(
    () => (tripGuide && tripGuide.days && tripGuide.days.length > 0 ? 'companion' : 'setup-destination')
  );

  // Setup form states
  const [destinationSearch, setDestinationSearch] = useState('');
  const [destinationResults, setDestinationResults] = useState<any[]>([]);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [regionFilter, setRegionFilter] = useState<'all' | 'middle-east' | 'asia' | 'europe' | 'other'>('all');
  const [selectedDest, setSelectedDest] = useState<any>(tripGuide?.destination || {
    name: location.name,
    formattedAddress: `${location.name}, ${location.country}`,
    lat: location.lat,
    lng: location.lng,
    country: location.country,
  });

  const [durationDays, setDurationDays] = useState(tripGuide?.preferences?.durationDays || 3);
  const [startDate, setStartDate] = useState(tripGuide?.preferences?.startDate || 'Today');
  const [startingLocation, setStartingLocation] = useState(
    tripGuide?.preferences?.startingLocation || 'Central Hotel'
  );
  const [travelStyle, setTravelStyle] = useState<'relaxed' | 'moderate' | 'fast-paced' | 'walking-friendly'>(
    tripGuide?.preferences?.travelStyle || 'moderate'
  );
  const [dailyStartTime, setDailyStartTime] = useState(
    tripGuide?.preferences?.dailyStartTime || '09:00 AM'
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    tripGuide?.preferences?.interests || ['mosques', 'halal-food', 'islamic-heritage', 'culture']
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTipIndex, setGenerationTipIndex] = useState(0);

  // Active day selection in Companion
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(
    tripGuide?.activeDayNumber || 1
  );

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);

  // Generation tips rotation
  useEffect(() => {
    if (!isGenerating) return;
    const tips = [
      'Querying Google Places for verified community mosques...',
      'Discovering authentic Halal restaurants & halal meat menus...',
      'Synchronizing Dhuhr, Asr, and Maghrib prayer breaks with Gemini AI...',
      'Optimizing travel routes to minimize walking and taxi times...',
      'Polishing your personalized live travel companion...',
    ];
    const interval = setInterval(() => {
      setGenerationTipIndex((prev) => (prev + 1) % tips.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Destination Search Debounce
  useEffect(() => {
    if (!destinationSearch.trim() || destinationSearch.trim().length < 2) {
      setDestinationResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      try {
        const res = await fetch('/api/places/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: destinationSearch.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          setDestinationResults(data.places || []);
        }
      } catch (err) {
        console.error('Error searching destination:', err);
      } finally {
        setIsSearchingDest(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [destinationSearch]);

  const currentDay = useMemo(() => {
    if (!tripGuide?.days || tripGuide.days.length === 0) return null;
    return tripGuide.days.find((d) => d.dayNumber === selectedDayNumber) || tripGuide.days[0];
  }, [tripGuide, selectedDayNumber]);

  // Calculate day completion progress
  const progressStats = useMemo(() => {
    if (!currentDay) return { completed: 0, total: 0, percent: 0, activeStop: null, nextStop: null };
    const total = currentDay.stops.length;
    const completed = currentDay.stops.filter((s) => s.status === 'completed').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const activeStop = currentDay.stops.find((s) => s.status === 'active');
    const nextStop = currentDay.stops.find((s) => s.status === 'upcoming');
    return { completed, total, percent, activeStop, nextStop };
  }, [currentDay]);

  // Distance from user coordinates to next or active stop
  const targetDistanceInfo = useMemo(() => {
    const target = progressStats.activeStop || progressStats.nextStop;
    if (!target || !target.lat || !target.lng || !userCoords) return null;
    const meters = calcHaversineMeters(userCoords.lat, userCoords.lng, target.lat, target.lng);
    const distStr = formatDist(meters);
    const timeStr =
      meters < 1500
        ? `${Math.max(1, Math.round(meters / 80))} min walk`
        : `${Math.max(2, Math.round(meters / 400))} min drive`;
    return { meters, distStr, timeStr, stopTitle: target.title };
  }, [progressStats, userCoords]);

  // Handler: Start Trip Generation
  const handleGenerateTrip = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/trip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: selectedDest,
          startingLocation,
          startDate: startDate === 'Today' ? new Date().toISOString().split('T')[0] : startDate,
          durationDays,
          dailyStartTime,
          travelStyle,
          interests: selectedInterests,
          prayerTimes: {
            dhuhr: prayerTimes.dhuhr,
            asr: prayerTimes.asr,
            maghrib: prayerTimes.maghrib,
          },
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      if (data.guide) {
        onUpdateTripGuide(data.guide);
        setSelectedDayNumber(1);
        setViewMode('companion');
      }
    } catch (err) {
      console.error('Trip generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Delay Schedule (running late)
  const handleAdjustSchedule = async (delayMinutes: number) => {
    try {
      const res = await fetch('/api/trip/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide: tripGuide,
          dayNumber: selectedDayNumber,
          adjustmentType: 'delay',
          delayMinutes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.guide) onUpdateTripGuide(data.guide);
      }
    } catch (err) {
      console.error('Replan error:', err);
    } finally {
      setIsDelayModalOpen(false);
    }
  };

  // Handler: Skip Stop
  const handleSkipStop = async (stopId: string) => {
    try {
      const res = await fetch('/api/trip/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide: tripGuide,
          dayNumber: selectedDayNumber,
          adjustmentType: 'skip',
          stopId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.guide) onUpdateTripGuide(data.guide);
      }
    } catch (err) {
      console.error('Skip stop error:', err);
    }
  };

  // Handler: Toggle Stop Completed
  const handleToggleComplete = async (stopId: string) => {
    try {
      const res = await fetch('/api/trip/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide: tripGuide,
          dayNumber: selectedDayNumber,
          adjustmentType: 'mark_complete',
          stopId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.guide) onUpdateTripGuide(data.guide);
      }
    } catch (err) {
      console.error('Toggle complete error:', err);
    }
  };

  // Handler: Add Stop
  const handleAddStop = async (newStopData: Omit<TripStop, 'id'>) => {
    try {
      const res = await fetch('/api/trip/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide: tripGuide,
          dayNumber: selectedDayNumber,
          adjustmentType: 'add_stop',
          newStop: newStopData,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.guide) onUpdateTripGuide(data.guide);
      }
    } catch (err) {
      console.error('Add stop error:', err);
    }
  };

  // Handler: Delete Stop
  const handleDeleteStop = async (stopId: string) => {
    try {
      const res = await fetch('/api/trip/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide: tripGuide,
          dayNumber: selectedDayNumber,
          adjustmentType: 'delete_stop',
          stopId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.guide) onUpdateTripGuide(data.guide);
      }
    } catch (err) {
      console.error('Delete stop error:', err);
    }
  };

  const getStopBadgeIcon = (type: TripStopType) => {
    switch (type) {
      case 'prayer':
        return (
          <div className="w-8 h-8 rounded-xl bg-[#FBF3DE] text-[#C9A24B] flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </div>
        );
      case 'food':
        return (
          <div className="w-8 h-8 rounded-xl bg-[#E3F1ED] text-[#0F5C4D] flex items-center justify-center shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
        );
      case 'freetime':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
        );
      case 'sightseeing':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-[#E3F1ED] text-[#0F5C4D] flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
        );
    }
  };

  // ==============================================================
  // 1. SETUP SCREEN: DESTINATION SELECTION
  // ==============================================================
  if (viewMode === 'setup-destination') {
    return (
      <div className="p-4 sm:p-5 flex flex-col space-y-4 animate-fade-in max-w-lg mx-auto">
        <div className="pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3F1ED] text-[#0F5C4D] text-xs font-bold mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Trip Guide Companion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14211F]">Where are you going?</h1>
          <p className="text-xs text-[#5E6E6A] mt-1">
            Choose your destination to build a personalized Muslim-friendly travel itinerary synced with prayer times and halal dining.
          </p>
        </div>

        {/* Search destination input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#5E6E6A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={destinationSearch}
            onChange={(e) => setDestinationSearch(e.target.value)}
            placeholder="Search city or country (e.g. Istanbul, Kuala Lumpur)..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E4E8E5] bg-white text-sm text-[#14211F] placeholder:text-[#5E6E6A] focus:outline-none focus:border-[#0F5C4D] shadow-2xs"
          />
          {isSearchingDest && (
            <Loader2 className="w-4 h-4 text-[#0F5C4D] absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
          )}
        </div>

        {/* Google Places search results dropdown if active */}
        {destinationResults.length > 0 && (
          <div className="p-2 bg-white rounded-2xl border border-[#E4E8E5] shadow-lg space-y-1 max-h-60 overflow-y-auto">
            {destinationResults.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedDest({
                    name: p.name,
                    formattedAddress: p.formattedAddress,
                    lat: p.lat,
                    lng: p.lng,
                    country: p.formattedAddress?.split(',').pop()?.trim() || '',
                  });
                  setDestinationSearch('');
                  setDestinationResults([]);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-[#E3F1ED]/50 transition-colors flex items-center gap-3 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#0F5C4D] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#14211F] truncate">{p.name}</div>
                  <div className="text-[11px] text-[#5E6E6A] truncate">{p.formattedAddress}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Quick Location Action: Current Location */}
        <button
          type="button"
          onClick={() => {
            setSelectedDest({
              name: location.name,
              formattedAddress: `${location.name}, ${location.country}`,
              lat: location.lat,
              lng: location.lng,
              country: location.country,
            });
          }}
          className="w-full p-3 bg-white rounded-2xl border border-[#E4E8E5] hover:border-[#0F5C4D] text-left flex items-center justify-between transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E3F1ED] text-[#0F5C4D] flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#14211F] group-hover:text-[#0F5C4D]">
                Use Current Location
              </div>
              <div className="text-[11px] text-[#5E6E6A]">
                {location.name} ({location.country})
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#5E6E6A]" />
        </button>

        {/* Popular Muslim-Friendly Destinations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5E6E6A] uppercase tracking-wider">
              Popular Destinations ({POPULAR_CITIES.length})
            </span>
            <span className="text-[10px] text-[#0F5C4D] font-semibold">
              Filter by region
            </span>
          </div>

          {/* Region Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar mb-2">
            {[
              { id: 'all', label: 'All Places' },
              { id: 'middle-east', label: '🕌 Middle East' },
              { id: 'asia', label: '🌏 Asia' },
              { id: 'europe', label: '🏛️ Europe & Heritage' },
              { id: 'other', label: '🌐 Global' },
            ].map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => setRegionFilter(reg.id as any)}
                className={`py-1 px-2.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  regionFilter === reg.id
                    ? 'bg-[#0F5C4D] text-white shadow-xs'
                    : 'bg-white border border-[#E4E8E5] text-[#5E6E6A] hover:text-[#14211F]'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {POPULAR_CITIES.filter((city) => {
              if (regionFilter === 'all') return true;
              const c = city.country.toLowerCase();
              if (regionFilter === 'middle-east') {
                return (
                  c.includes('emirates') ||
                  c.includes('saudi') ||
                  c.includes('qatar') ||
                  c.includes('egypt') ||
                  c.includes('jordan') ||
                  c.includes('oman')
                );
              }
              if (regionFilter === 'asia') {
                return (
                  c.includes('malaysia') ||
                  c.includes('singapore') ||
                  c.includes('indonesia') ||
                  c.includes('japan') ||
                  c.includes('korea') ||
                  c.includes('thailand') ||
                  c.includes('azerbaijan') ||
                  c.includes('uzbekistan')
                );
              }
              if (regionFilter === 'europe') {
                return (
                  c.includes('turkey') ||
                  c.includes('united kingdom') ||
                  c.includes('france') ||
                  c.includes('spain') ||
                  c.includes('bosnia')
                );
              }
              if (regionFilter === 'other') {
                return (
                  c.includes('united states') ||
                  c.includes('australia') ||
                  c.includes('south africa')
                );
              }
              return true;
            }).map((city) => {
              const isSelected = selectedDest?.name === city.name;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    setSelectedDest({
                      name: city.name,
                      formattedAddress: `${city.name}, ${city.country}`,
                      lat: city.lat,
                      lng: city.lng,
                      country: city.country,
                    });
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E3F1ED] border-[#0F5C4D] text-[#0F5C4D] shadow-xs ring-1 ring-[#0F5C4D]'
                      : 'bg-white border-[#E4E8E5] text-[#14211F] hover:border-[#0F5C4D]/40'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{city.name.split(',')[0]}</div>
                  <div className="text-[10px] text-[#5E6E6A] truncate">{city.country}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Destination Card Banner */}
        {selectedDest && (
          <div className="p-4 rounded-2xl bg-[#0F5C4D] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#C9A24B]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-emerald-200 uppercase tracking-wider font-semibold">
                  Selected Destination
                </div>
                <div className="text-base font-bold truncate">{selectedDest.name}</div>
                <div className="text-xs text-white/70 truncate">{selectedDest.formattedAddress}</div>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-[#C9A24B] shrink-0" />
          </div>
        )}

        {/* Continue Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setViewMode('setup-details')}
            disabled={!selectedDest}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#0F5C4D] hover:bg-[#0A4237] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>Set Trip Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {Boolean(tripGuide?.days && tripGuide.days.length > 0) && (
          <div className="text-center">
            <button
              onClick={() => setViewMode('companion')}
              className="text-xs text-[#5E6E6A] underline hover:text-[#0F5C4D] cursor-pointer"
            >
              Cancel & return to current trip
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==============================================================
  // 2. SETUP SCREEN: TRIP DETAILS
  // ==============================================================
  if (viewMode === 'setup-details') {
    if (isGenerating) {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-[#E3F1ED] text-[#0F5C4D] flex items-center justify-center shadow-md animate-pulse">
            <Sparkles className="w-8 h-8 text-[#C9A24B]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#14211F]">
              Generating your Trip Guide for {selectedDest?.name?.split(',')[0]}
            </h2>
            <p className="text-xs text-[#5E6E6A] mt-2 max-w-xs mx-auto min-h-[36px]">
              {generationTipIndex === 0 && 'Connecting with Google Places for authentic local mosques...'}
              {generationTipIndex === 1 && 'Selecting top-rated certified Halal dining spots...'}
              {generationTipIndex === 2 && 'Anchoring prayer times with Gemini AI...'}
              {generationTipIndex === 3 && 'Arranging walking & transit times in geographic sequence...'}
              {generationTipIndex === 4 && 'Finalizing your live travel timeline companion...'}
            </p>
          </div>
          <div className="w-48 bg-[#E4E8E5] h-2 rounded-full overflow-hidden">
            <div className="bg-[#0F5C4D] h-full rounded-full animate-indeterminate w-1/2" />
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-5 flex flex-col space-y-4 animate-fade-in max-w-lg mx-auto">
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setViewMode('setup-destination')}
            className="text-xs font-semibold text-[#5E6E6A] hover:text-[#0F5C4D] flex items-center gap-1 cursor-pointer"
          >
            ← Change Destination
          </button>
          <div className="text-xs font-bold text-[#0F5C4D] bg-[#E3F1ED] px-2.5 py-0.5 rounded-full">
            {selectedDest?.name?.split(',')[0]}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[#14211F]">Trip Details</h1>
          <p className="text-xs text-[#5E6E6A]">Customize duration and Muslim-friendly travel preferences.</p>
        </div>

        {/* Duration chips */}
        <div className="p-3.5 bg-white rounded-2xl border border-[#E4E8E5] shadow-2xs space-y-2">
          <label className="block text-xs font-bold text-[#14211F]">Duration</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDurationDays(d)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  durationDays === d
                    ? 'bg-[#0F5C4D] text-white shadow-xs'
                    : 'bg-[#F7F5EF] text-[#5E6E6A] hover:text-[#14211F]'
                }`}
              >
                {d} {d === 1 ? 'Day' : 'Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Style */}
        <div className="p-3.5 bg-white rounded-2xl border border-[#E4E8E5] shadow-2xs space-y-2">
          <label className="block text-xs font-bold text-[#14211F]">Preferred Travel Style</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'relaxed', label: '🌿 Relaxed', desc: 'Ample prayer & rest buffers' },
              { id: 'moderate', label: '⚖️ Moderate', desc: 'Balanced highlights & prayer' },
              { id: 'fast-paced', label: '⚡ Fast-paced', desc: 'Cover maximum sights' },
              { id: 'walking-friendly', label: '🚶 Walking-friendly', desc: 'Compact pedestrian zones' },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setTravelStyle(style.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  travelStyle === style.id
                    ? 'bg-[#E3F1ED] border-[#0F5C4D] text-[#0F5C4D]'
                    : 'bg-[#F7F5EF] border-[#E4E8E5] text-[#14211F]'
                }`}
              >
                <div className="text-xs font-bold">{style.label}</div>
                <div className="text-[10px] text-[#5E6E6A] truncate">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Daily Start Time & Starting Location */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-white rounded-2xl border border-[#E4E8E5] shadow-2xs space-y-1">
            <label className="block text-[11px] font-bold text-[#5E6E6A]">Daily Start Time</label>
            <select
              value={dailyStartTime}
              onChange={(e) => setDailyStartTime(e.target.value)}
              className="w-full text-xs font-bold text-[#14211F] bg-transparent focus:outline-none"
            >
              <option value="08:30 AM">8:30 AM (Early)</option>
              <option value="09:00 AM">9:00 AM (Standard)</option>
              <option value="09:30 AM">9:30 AM</option>
              <option value="10:00 AM">10:00 AM (Relaxed)</option>
            </select>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-[#E4E8E5] shadow-2xs space-y-1">
            <label className="block text-[11px] font-bold text-[#5E6E6A]">Starting Location</label>
            <input
              type="text"
              value={startingLocation}
              onChange={(e) => setStartingLocation(e.target.value)}
              placeholder="e.g. Hotel in Downtown"
              className="w-full text-xs font-bold text-[#14211F] bg-transparent focus:outline-none placeholder:text-[#5E6E6A]"
            />
          </div>
        </div>

        {/* Interests */}
        <div className="p-3.5 bg-white rounded-2xl border border-[#E4E8E5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#14211F]">Key Interests</label>
            <span className="text-[10px] text-[#5E6E6A]">Tap to toggle</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'mosques', label: '🕌 Mosques' },
              { id: 'halal-food', label: '🍽️ Halal Food' },
              { id: 'islamic-heritage', label: '📜 Islamic & Historic Sites' },
              { id: 'nature', label: '🌿 Nature' },
              { id: 'culture', label: '🏛️ Culture' },
              { id: 'shopping', label: '🛍️ Souks & Shopping' },
              { id: 'family', label: '👨‍👩‍👧 Family-friendly' },
              { id: 'relaxation', label: '☕ Relaxation' },
            ].map((interest) => {
              const active = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => {
                    if (active) {
                      setSelectedInterests(selectedInterests.filter((i) => i !== interest.id));
                    } else {
                      setSelectedInterests([...selectedInterests, interest.id]);
                    }
                  }}
                  className={`py-1.5 px-3 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0F5C4D] text-white shadow-2xs'
                      : 'bg-[#F7F5EF] text-[#5E6E6A] hover:text-[#14211F]'
                  }`}
                >
                  {interest.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleGenerateTrip}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#0F5C4D] hover:bg-[#0A4237] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#C9A24B]" />
            <span>Generate Trip Guide</span>
          </button>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 3. LIVE TRIP COMPANION & TIMELINE SCREEN
  // ==============================================================
  if (!tripGuide || !tripGuide.destination || !tripGuide.days || tripGuide.days.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-[#E3F1ED] text-[#0F5C4D] flex items-center justify-center shadow-xs">
          <Compass className="w-8 h-8 text-[#0F5C4D]" />
        </div>
        <h2 className="text-xl font-bold text-[#14211F]">No Trip Plan Yet</h2>
        <p className="text-xs text-[#5E6E6A]">
          Choose a destination and let Musafir's AI build a customized travel itinerary with prayer times and halal dining.
        </p>
        <button
          onClick={() => setViewMode('setup-destination')}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#0F5C4D] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
        >
          Create Trip Plan
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 flex flex-col space-y-4 animate-fade-in max-w-lg mx-auto">
      {/* Top Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F5C4D] uppercase tracking-wider mb-0.5">
            <Compass className="w-3 h-3 text-[#C9A24B]" />
            <span>Live Trip Companion</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#14211F]">
            {tripGuide.destination.name.split(',')[0]}
          </h1>
          <div className="text-xs text-[#5E6E6A] font-medium mt-0.5">
            {tripGuide.days.length} days · {tripGuide.preferences.travelStyle} style
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Create new plan / Reset trip */}
          <button
            onClick={() => {
              if (onResetTripGuide) {
                onResetTripGuide();
              }
              setViewMode('setup-destination');
            }}
            className="py-1.5 px-2.5 rounded-full bg-white hover:bg-[#E3F1ED] text-[#5E6E6A] hover:text-[#0F5C4D] border border-[#E4E8E5] transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 shadow-2xs"
            title="Create a new trip plan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Plan</span>
          </button>

          {/* Ask Musafir Pill */}
          <button
            onClick={onOpenAsk}
            className="py-1.5 px-3 rounded-full bg-[#0F5C4D] hover:bg-[#0A4237] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
            <span>Ask</span>
          </button>
        </div>
      </div>

      {/* Progress & Live Distance Card */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E4E8E5] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#14211F]">
            Day {selectedDayNumber} Progress
          </span>
          <span className="text-[#0F5C4D] font-bold">
            {progressStats.completed} of {progressStats.total} completed ({progressStats.percent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E4E8E5] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#0F5C4D] h-full rounded-full transition-all duration-500"
            style={{ width: `${progressStats.percent}%` }}
          />
        </div>

        {/* Live Distance to Next Stop if GPS available */}
        {targetDistanceInfo && (
          <div className="pt-1 flex items-center justify-between border-t border-[#E4E8E5]/60 text-xs">
            <div className="flex items-center gap-2 text-[#0F5C4D] min-w-0 font-medium">
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {targetDistanceInfo.distStr} to {targetDistanceInfo.stopTitle} ({targetDistanceInfo.timeStr})
              </span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${targetDistanceInfo.stopTitle} ${tripGuide.destination.name}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#0F5C4D] underline hover:text-[#0A4237] shrink-0 ml-2"
            >
              Directions
            </a>
          </div>
        )}
      </div>

      {/* Day Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tripGuide.days.map((d) => (
          <button
            key={d.dayNumber}
            onClick={() => setSelectedDayNumber(d.dayNumber)}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              selectedDayNumber === d.dayNumber
                ? 'bg-[#0F5C4D] text-white shadow-xs'
                : 'bg-white text-[#5E6E6A] border border-[#E4E8E5] hover:text-[#14211F]'
            }`}
          >
            Day {d.dayNumber}
          </button>
        ))}
      </div>

      {/* Day Theme Banner */}
      {currentDay && (
        <div className="p-3 rounded-xl bg-[#E3F1ED] text-[#0F5C4D] flex items-center justify-between text-xs font-medium border border-[#0F5C4D]/10">
          <div className="flex items-center gap-2 truncate">
            <Sun className="w-4 h-4 shrink-0 text-[#0F5C4D]" />
            <span className="font-bold truncate">{currentDay.title}</span>
          </div>
          <span className="text-[11px] text-[#5E6E6A] shrink-0 font-normal">
            {currentDay.stops.length} stops
          </span>
        </div>
      )}

      {/* Quick Action Tools Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsDelayModalOpen(true)}
          className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#E4E8E5] hover:border-[#0F5C4D] text-xs font-bold text-[#14211F] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <Clock className="w-3.5 h-3.5 text-[#C9A24B]" />
          <span>Running late?</span>
        </button>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#E4E8E5] hover:border-[#0F5C4D] text-xs font-bold text-[#14211F] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#0F5C4D]" />
          <span>Add Stop</span>
        </button>

        <button
          onClick={onOpenAsk}
          className="py-2 px-3 rounded-xl bg-white border border-[#E4E8E5] hover:border-[#0F5C4D] text-xs font-bold text-[#0F5C4D] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
          <span>AI Help</span>
        </button>
      </div>

      {/* Timeline Stops List */}
      <div className="space-y-3 pt-1 relative">
        {currentDay?.stops.map((stop, index) => {
          const isCompleted = stop.status === 'completed';
          const isActive = stop.status === 'active';
          const isSkipped = stop.status === 'skipped';

          return (
            <div key={stop.id} className="flex items-start gap-3 relative group">
              {/* Left Time & Timeline Column */}
              <div className="w-16 shrink-0 pt-1 text-right">
                <div
                  className={`text-xs font-bold ${
                    isActive ? 'text-[#0F5C4D]' : isCompleted ? 'text-slate-400 line-through' : 'text-[#5E6E6A]'
                  }`}
                >
                  {stop.time}
                </div>
                {stop.distance && (
                  <div className="text-[10px] text-[#5E6E6A] font-medium">{stop.distance}</div>
                )}
              </div>

              {/* Stop Card */}
              <div
                className={`flex-1 p-3.5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-white border-[#0F5C4D] ring-2 ring-[#0F5C4D]/15 shadow-sm'
                    : isCompleted
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : isSkipped
                    ? 'bg-slate-100/60 border-slate-200 opacity-60'
                    : 'bg-white border-[#E4E8E5] hover:border-[#0F5C4D]/40 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {getStopBadgeIcon(stop.type)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-sm font-bold truncate ${
                            isCompleted ? 'line-through text-slate-500' : 'text-[#14211F]'
                          }`}
                        >
                          {stop.title}
                        </span>

                        {/* Status Badges */}
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-[#E3F1ED] text-[#0F5C4D] text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                            Now
                          </span>
                        )}
                        {isSkipped && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                            Skipped
                          </span>
                        )}
                        {stop.halalStatus && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Halal</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#5E6E6A] mt-0.5">{stop.subtitle}</div>

                      {/* Travel time from previous stop */}
                      {stop.travelTime && (
                        <div className="text-[10px] text-[#5E6E6A] mt-1 flex items-center gap-1 font-medium">
                          <Navigation className="w-3 h-3 text-[#0F5C4D]" />
                          <span>~{stop.travelTime} from previous stop</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Checkbox */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Directions External Link */}
                    {stop.googleMapsUri && (
                      <a
                        href={stop.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-[#0F5C4D] rounded-lg hover:bg-slate-100 transition-colors"
                        title="Open in Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Complete Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(stop.id)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-[#0F5C4D] text-white shadow-2xs'
                          : 'bg-[#F7F5EF] text-[#5E6E6A] hover:bg-[#E3F1ED] hover:text-[#0F5C4D]'
                      }`}
                      title={isCompleted ? 'Mark upcoming' : 'Mark done'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    {/* Delete Custom Stop */}
                    {stop.id.startsWith('custom') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteStop(stop.id)}
                        className="p-1 text-slate-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Remove stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card footer options for active or upcoming stops */}
                {!isCompleted && !isSkipped && (
                  <div className="mt-2.5 pt-2 border-t border-[#E4E8E5]/70 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleSkipStop(stop.id)}
                      className="text-[#5E6E6A] hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Skip activity
                    </button>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${stop.title} ${tripGuide.destination.name}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0F5C4D] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Add Stop Button */}
      <div className="pt-2">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#0F5C4D] hover:bg-[#0A4237] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add a stop</span>
        </button>
      </div>

      {/* Modals */}
      <AddStopModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStop={handleAddStop}
        cityLocation={{
          name: tripGuide.destination.name,
          lat: tripGuide.destination.lat,
          lng: tripGuide.destination.lng,
        }}
      />

      {/* Running Late Adjust Modal */}
      {isDelayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-[#E4E8E5] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E8E5]">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#C9A24B]" />
                <h3 className="text-base font-bold text-[#14211F]">Running Late?</h3>
              </div>
              <button
                onClick={() => setIsDelayModalOpen(false)}
                className="text-[#5E6E6A] hover:text-[#14211F] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-[#5E6E6A]">
              Shift all upcoming activities today forward automatically while keeping prayer times anchored.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleAdjustSchedule(mins)}
                  className="py-3 px-4 rounded-xl bg-[#F7F5EF] hover:bg-[#E3F1ED] hover:text-[#0F5C4D] border border-[#E4E8E5] text-xs font-bold text-[#14211F] transition-colors cursor-pointer"
                >
                  +{mins} minutes
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
