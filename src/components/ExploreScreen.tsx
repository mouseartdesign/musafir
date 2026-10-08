import React, { useState, useEffect } from 'react';
import { Search, Navigation, AlertCircle, RefreshCw, ZoomIn } from 'lucide-react';
import { Place, LocationData } from '../types';
import { VectorMap } from './VectorMap';
import { PlaceDetailModal } from './PlaceDetailModal';
import { DUBAI_PLACES } from '../data/places';

interface ExploreScreenProps {
  location: LocationData;
  places?: Place[];
  defaultCategory?: 'mosque' | 'halal';
  onAddToTrip?: (place: Place) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  location,
  defaultCategory = 'halal',
  onAddToTrip,
}) => {
  const [category, setCategory] = useState<'mosque' | 'halal'>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [placesList, setPlacesList] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRadius, setCurrentRadius] = useState<number>(5000);

  // Fetch real places whenever category, location, or radius changes
  useEffect(() => {
    let isCancelled = false;

    const fetchPlaces = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const endpoint = category === 'mosque' ? '/api/places/mosques' : '/api/places/halal';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: location.lat,
            lng: location.lng,
            radius: currentRadius,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to load places');
        }

        const data = await res.json();
        if (!isCancelled) {
          if (Array.isArray(data.places) && data.places.length > 0) {
            setPlacesList(data.places);
          } else {
            // If API returned 0 results, fallback to filtered local places if Dubai or empty
            if (location.id === 'dubai') {
              setPlacesList(DUBAI_PLACES.filter((p) => p.category === category));
            } else {
              setPlacesList([]);
            }
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Places fetch error:', err);
          // Fallback to local places if available
          const fallback = DUBAI_PLACES.filter((p) => p.category === category);
          if (fallback.length > 0 && location.id === 'dubai') {
            setPlacesList(fallback);
            setIsLoading(false);
          } else {
            setError("Couldn't load nearby places.");
            setIsLoading(false);
          }
        }
      }
    };

    fetchPlaces();

    return () => {
      isCancelled = true;
    };
  }, [category, location.lat, location.lng, currentRadius]);

  const filteredPlaces = placesList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExpandRadius = () => {
    setCurrentRadius(10000);
  };

  const handleOpenDirections = (e: React.MouseEvent, place: Place) => {
    e.stopPropagation();
    if (place.googleMapsUri) {
      window.open(place.googleMapsUri, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${place.name} ${place.address || ''}`
      )}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-4 sm:p-5 flex flex-col space-y-4 animate-fade-in">
      {/* Top Heading */}
      <div className="pt-1">
        <h1 className="text-2xl font-extrabold text-[#14211F]">Explore nearby</h1>
      </div>

      {/* Segmented Switch: Mosques | Halal food */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-transparent">
        {/* Mosques Tab */}
        <button
          onClick={() => {
            setCategory('mosque');
            setSearchQuery('');
            setCurrentRadius(5000);
          }}
          className={`py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
            category === 'mosque'
              ? 'bg-[#0F5C4D] text-white shadow-xs'
              : 'bg-white text-[#14211F] border border-[#E4E8E5] hover:bg-slate-50'
          }`}
        >
          <svg
            className="w-4 h-4 fill-current shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 0 1 1-9-9Z" />
          </svg>
          <span>Mosques</span>
        </button>

        {/* Halal food Tab */}
        <button
          onClick={() => {
            setCategory('halal');
            setSearchQuery('');
            setCurrentRadius(5000);
          }}
          className={`py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all cursor-pointer ${
            category === 'halal'
              ? 'bg-[#0F5C4D] text-white shadow-xs'
              : 'bg-white text-[#14211F] border border-[#E4E8E5] hover:bg-slate-50'
          }`}
        >
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
            <path d="M15 11v11" />
            <path d="M6 2v20" />
            <path d="M6 7h4a2 2 0 0 0 2-2V2" />
          </svg>
          <span>Halal food</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5E6E6A]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            category === 'mosque' ? 'Search mosques nearby' : 'Search halal food nearby'
          }
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white text-sm text-[#14211F] placeholder:text-[#5E6E6A]/70 border border-[#E4E8E5] focus:outline-none focus:border-[#0F5C4D] shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-xs text-[#5E6E6A] font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Stylized Vector Map Preview */}
      <VectorMap
        category={category}
        places={filteredPlaces}
        selectedPlaceId={selectedPlace?.id}
        onSelectPlace={(p) => setSelectedPlace(p)}
      />

      {/* Places Cards List */}
      <div className="space-y-3 pt-1">
        {/* Loading State: Skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-4 bg-white rounded-2xl border border-[#E4E8E5] flex items-center justify-between animate-pulse"
              >
                <div className="flex items-start gap-3.5 flex-1 pr-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                    <div className="h-3 bg-slate-100 rounded-md w-1/4 mt-1" />
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="py-8 px-4 text-center bg-white rounded-2xl border border-[#E4E8E5] space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#14211F]">{error}</p>
              <p className="text-xs text-[#5E6E6A] mt-1">Check your connection or try again</p>
            </div>
            <button
              onClick={() => setCurrentRadius(currentRadius)}
              className="py-2 px-4 rounded-xl bg-[#0F5C4D] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Real Places List */}
        {!isLoading &&
          !error &&
          filteredPlaces.map((place) => (
            <div
              key={place.id}
              onClick={() => setSelectedPlace(place)}
              className="p-4 bg-white rounded-2xl border border-[#E4E8E5] hover:border-[#0F5C4D]/40 transition-all shadow-2xs flex items-center justify-between cursor-pointer group"
            >
              {/* Left: Icon and info */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-3">
                {/* Category Icon Square */}
                <div className="w-11 h-11 rounded-2xl bg-[#E3F1ED] flex items-center justify-center shrink-0 text-[#0F5C4D]">
                  {category === 'mosque' ? (
                    <svg
                      className="w-5 h-5 text-[#0F5C4D] fill-current"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                  ) : (
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
                  )}
                </div>

                {/* Title & Details */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#14211F] truncate group-hover:text-[#0F5C4D] transition-colors">
                    {place.name}
                  </div>
                  <div className="text-xs text-[#5E6E6A] mt-0.5">
                    {place.distance} {place.timeInfo ? `· ${place.timeInfo}` : ''}
                  </div>

                  {/* Tags row */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        place.isOpen ? 'bg-[#E3F1ED] text-[#0F5C4D]' : 'bg-slate-100 text-[#5E6E6A]'
                      }`}
                    >
                      {place.statusText}
                    </span>
                    {place.tags.slice(0, 1).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-[#F7F5EF] text-[#5E6E6A] text-[11px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Navigation Direction Button */}
              <button
                onClick={(e) => handleOpenDirections(e, place)}
                className="w-10 h-10 rounded-full bg-[#0F5C4D] hover:bg-[#0A4237] text-white flex items-center justify-center shrink-0 shadow-xs transition-colors cursor-pointer group-hover:scale-105"
                title={`Directions to ${place.name}`}
                aria-label={`Directions to ${place.name}`}
              >
                <Navigation className="w-4 h-4 fill-white" />
              </button>
            </div>
          ))}

        {/* Empty State with Expand Radius */}
        {!isLoading && !error && filteredPlaces.length === 0 && (
          <div className="py-12 text-center text-sm text-[#5E6E6A] bg-white rounded-2xl border border-[#E4E8E5] p-6 space-y-3">
            <p className="font-semibold text-[#14211F]">
              No {category === 'mosque' ? 'mosques' : 'halal restaurants'} found nearby.
            </p>
            <p className="text-xs text-[#5E6E6A]">
              {currentRadius <= 5000
                ? 'Try expanding your search radius to discover places further away.'
                : 'Try adjusting your search query or choosing another city.'}
            </p>
            {currentRadius <= 5000 && (
              <button
                onClick={handleExpandRadius}
                className="py-2.5 px-4 rounded-xl bg-[#0F5C4D] hover:bg-[#0A4237] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Expand search radius (10 km)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Place Details Modal */}
      <PlaceDetailModal
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onAddToTrip={onAddToTrip}
      />
    </div>
  );
};
