import React from 'react';
import { Place } from '../types';

interface VectorMapProps {
  category: 'mosque' | 'halal';
  places: Place[];
  selectedPlaceId?: string;
  onSelectPlace: (place: Place) => void;
  userLat?: number;
  userLng?: number;
}

export const VectorMap: React.FC<VectorMapProps> = ({
  category,
  places,
  selectedPlaceId,
  onSelectPlace,
  userLat,
  userLng,
}) => {
  // Balanced street coordinates on the vector grid
  const defaultPositions = [
    { top: '34%', left: '26%' },
    { top: '38%', left: '80%' },
    { top: '68%', left: '58%' },
    { top: '22%', left: '62%' },
    { top: '75%', left: '24%' },
  ];

  return (
    <div className="w-full h-44 sm:h-48 rounded-2xl bg-[#EBF2EE] border border-[#E4E8E5] relative overflow-hidden shadow-2xs">
      {/* Stylized road network matching Figma */}
      {/* Horizontal roads */}
      <div className="absolute top-[28%] left-0 right-0 h-4 bg-white" />
      <div className="absolute top-[60%] left-0 right-0 h-4 bg-white" />
      <div className="absolute top-[85%] left-0 right-0 h-3 bg-white" />

      {/* Vertical roads */}
      <div className="absolute top-0 bottom-0 left-[20%] w-4 bg-white" />
      <div className="absolute top-0 bottom-0 left-[48%] w-4 bg-white" />
      <div className="absolute top-0 bottom-0 left-[75%] w-4 bg-white" />

      {/* User Location Beacon (Golden pulsing dot at center intersection) */}
      <div className="absolute top-[48%] left-[45%] -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-[#C9A24B]/25 animate-ping absolute" />
        <div className="w-7 h-7 rounded-full bg-[#C9A24B]/35 flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-[#C9A24B] border-2 border-white shadow-xs" />
        </div>
      </div>

      {/* Map Place Pins */}
      {places.slice(0, 5).map((place, idx) => {
        let top = defaultPositions[idx]?.top || '50%';
        let left = defaultPositions[idx]?.left || '50%';

        // If userLat/userLng and place coords exist, calculate relative direction
        if (userLat && userLng && place.lat && place.lng) {
          const dLat = place.lat - userLat;
          const dLng = place.lng - userLng;

          // Scale offset to fit within 15% - 85% range
          const maxDelta = 0.05; // ~5km in degrees
          const normY = Math.max(-1, Math.min(1, dLat / maxDelta));
          const normX = Math.max(-1, Math.min(1, dLng / maxDelta));

          // Invert Y for screen coordinates (north is up)
          const calcTop = Math.round(48 - normY * 30);
          const calcLeft = Math.round(45 + normX * 35);

          // Clamped boundaries
          top = `${Math.max(18, Math.min(82, calcTop))}%`;
          left = `${Math.max(15, Math.min(85, calcLeft))}%`;
        }

        const isSelected = selectedPlaceId === place.id;

        return (
          <button
            key={place.id}
            onClick={() => onSelectPlace(place)}
            style={{ top, left }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-transform cursor-pointer group ${
              isSelected ? 'scale-125 z-40' : 'hover:scale-110'
            }`}
            aria-label={`View ${place.name}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
                isSelected
                  ? 'bg-[#C9A24B] text-[#14211F] ring-2 ring-[#0F5C4D]'
                  : 'bg-[#0F5C4D] text-white'
              }`}
            >
              {category === 'mosque' ? (
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 0 1 1-9-9Z" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
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
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
