import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Loader2, Compass, Check } from 'lucide-react';
import { TripStop, TripStopType } from '../types';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStop: (stop: Omit<TripStop, 'id'>) => void;
  cityLocation?: { lat: number; lng: number; name: string };
}

export const AddStopModal: React.FC<AddStopModalProps> = ({
  isOpen,
  onClose,
  onAddStop,
  cityLocation,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [time, setTime] = useState('2:00 PM');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState<TripStopType>('sightseeing');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [googleMapsUri, setGoogleMapsUri] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      setTitle('');
      setSubtitle('');
      setAddress('');
      setLat(undefined);
      setLng(undefined);
      setGoogleMapsUri(undefined);
    }
  }, [isOpen]);

  // Debounced Google Places Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch('/api/places/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery.trim(),
            lat: cityLocation?.lat,
            lng: cityLocation?.lng,
            radius: 20000,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.places || []);
        }
      } catch (err) {
        console.error('Error searching places in modal:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, cityLocation?.lat, cityLocation?.lng]);

  if (!isOpen) return null;

  const handleSelectPlace = (place: any) => {
    setTitle(place.name);
    setAddress(place.formattedAddress || '');
    setLat(place.lat);
    setLng(place.lng);
    setGoogleMapsUri(place.googleMapsUri);

    const typeStr = JSON.stringify(place.types || []).toLowerCase();
    if (typeStr.includes('mosque') || place.name.toLowerCase().includes('masjid')) {
      setType('prayer');
      setSubtitle('Prayer visit · Wudu area');
    } else if (
      typeStr.includes('restaurant') ||
      typeStr.includes('food') ||
      typeStr.includes('cafe')
    ) {
      setType('food');
      setSubtitle('Halal dining · Meal stop');
    } else {
      setType('sightseeing');
      setSubtitle('Sightseeing & exploration · 1 h 30');
    }

    setActiveTab('manual');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddStop({
      time,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Activity',
      type,
      status: 'upcoming',
      address,
      lat,
      lng,
      googleMapsUri,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-[#E4E8E5] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E8E5] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#14211F]">Add a Stop</h2>
            <p className="text-xs text-[#5E6E6A]">Search real Google Places or customize</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#5E6E6A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#0F5C4D] text-white'
                : 'bg-[#F7F5EF] text-[#5E6E6A] hover:text-[#14211F]'
            }`}
          >
            🔍 Search Google Places
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-[#0F5C4D] text-white'
                : 'bg-[#F7F5EF] text-[#5E6E6A] hover:text-[#14211F]'
            }`}
          >
            ✏️ Stop Details
          </button>
        </div>

        {/* Content area */}
        <div className="overflow-y-auto flex-1 py-3">
          {activeTab === 'search' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#5E6E6A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search places in ${cityLocation?.name?.split(',')[0] || 'destination'}...`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4E8E5] bg-[#F7F5EF] text-sm text-[#14211F] focus:outline-none focus:border-[#0F5C4D]"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-[#0F5C4D] absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
                )}
              </div>

              {/* Suggestions list */}
              <div className="space-y-1.5 mt-2">
                {searchResults.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left p-3 rounded-xl border border-[#E4E8E5] hover:border-[#0F5C4D] hover:bg-[#E3F1ED]/40 transition-colors flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#E3F1ED] text-[#0F5C4D] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#14211F] group-hover:text-[#0F5C4D] truncate">
                        {place.name}
                      </div>
                      <div className="text-[11px] text-[#5E6E6A] truncate">
                        {place.formattedAddress || 'Location'}
                      </div>
                    </div>
                  </button>
                ))}

                {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
                  <div className="text-center py-6 text-xs text-[#5E6E6A]">
                    No places found matching "{searchQuery}". You can enter custom details on the next tab.
                  </div>
                )}

                {!searchQuery.trim() && (
                  <div className="p-4 rounded-xl bg-[#F7F5EF] text-center text-xs text-[#5E6E6A]">
                    Type a mosque, restaurant, or landmark to search real verified locations with Google Places.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#5E6E6A] mb-1">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('sightseeing')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      type === 'sightseeing'
                        ? 'bg-[#0F5C4D] text-white border-[#0F5C4D]'
                        : 'bg-[#F7F5EF] text-[#14211F] border-[#E4E8E5]'
                    }`}
                  >
                    Sightseeing
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('prayer')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      type === 'prayer'
                        ? 'bg-[#0F5C4D] text-white border-[#0F5C4D]'
                        : 'bg-[#F7F5EF] text-[#14211F] border-[#E4E8E5]'
                    }`}
                  >
                    Prayer Break
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('food')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      type === 'food'
                        ? 'bg-[#0F5C4D] text-white border-[#0F5C4D]'
                        : 'bg-[#F7F5EF] text-[#14211F] border-[#E4E8E5]'
                    }`}
                  >
                    Halal Meal
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('freetime')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      type === 'freetime'
                        ? 'bg-[#0F5C4D] text-white border-[#0F5C4D]'
                        : 'bg-[#F7F5EF] text-[#14211F] border-[#E4E8E5]'
                    }`}
                  >
                    Free Time / Rest
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5E6E6A] mb-1">Time</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 1:30 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E8E5] bg-[#F7F5EF] text-sm text-[#14211F] focus:outline-none focus:border-[#0F5C4D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5E6E6A] mb-1">Stop Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Jumeirah Mosque, Al Mandi House, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E8E5] bg-[#F7F5EF] text-sm text-[#14211F] focus:outline-none focus:border-[#0F5C4D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5E6E6A] mb-1">
                  Details / Description
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Cultural tour · 1 h 30"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E8E5] bg-[#F7F5EF] text-sm text-[#14211F] focus:outline-none focus:border-[#0F5C4D]"
                />
              </div>

              {address && (
                <div className="p-2.5 rounded-xl bg-[#E3F1ED] text-xs text-[#0F5C4D] flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{address}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#0F5C4D] hover:bg-[#0A4237] text-white font-semibold text-sm cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Stop to Timeline</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

