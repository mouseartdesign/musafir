import React, { useState } from 'react';
import { Search, MapPin, X, Check } from 'lucide-react';
import { LocationData } from '../types';
import { POPULAR_CITIES } from '../data/cities';

interface CitySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: LocationData) => void;
  currentCityId: string;
  onUseCurrentLocation: () => void;
  isLocating?: boolean;
}

export const CitySelectModal: React.FC<CitySelectModalProps> = ({
  isOpen,
  onClose,
  onSelectCity,
  currentCityId,
  onUseCurrentLocation,
  isLocating = false,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredCities = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-md bg-[#F7F5EF] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-[#E4E8E5]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E4E8E5] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#14211F]">Choose your city</h2>
            <p className="text-xs text-[#5E6E6A]">Used to calculate prayer times and Qibla</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-[#5E6E6A] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & GPS Option */}
        <div className="p-4 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5E6E6A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cities worldwide..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F5EF] text-sm text-[#14211F] placeholder:text-[#5E6E6A]/60 border border-[#E4E8E5] focus:outline-none focus:border-[#0F5C4D]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-xs text-[#5E6E6A]"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={onUseCurrentLocation}
            disabled={isLocating}
            className="w-full py-2.5 px-3.5 rounded-xl bg-[#E3F1ED] hover:bg-[#d5eae4] text-[#0F5C4D] text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>{isLocating ? 'Acquiring GPS location...' : 'Use my current location'}</span>
          </button>
        </div>

        {/* Cities List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          <p className="text-xs font-semibold text-[#5E6E6A] uppercase tracking-wider px-1">
            {search ? 'Matching Cities' : 'Popular Travel Destinations'}
          </p>

          {filteredCities.map((city) => {
            const isSelected = city.id === currentCityId;
            return (
              <button
                key={city.id}
                onClick={() => {
                  onSelectCity(city);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white border-2 border-[#0F5C4D] shadow-xs'
                    : 'bg-white border border-[#E4E8E5] hover:border-[#0F5C4D]/40'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-[#14211F]">{city.name}</div>
                  <div className="text-xs text-[#5E6E6A]">{city.country}</div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#0F5C4D] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}

          {filteredCities.length === 0 && (
            <div className="py-8 text-center text-sm text-[#5E6E6A]">
              No city found for "{search}". Try another spelling.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
