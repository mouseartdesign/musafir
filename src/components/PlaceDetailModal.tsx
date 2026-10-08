import React from 'react';
import { X, Navigation, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Place } from '../types';

interface PlaceDetailModalProps {
  place: Place | null;
  onClose: () => void;
  onAddToTrip?: (place: Place) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  onClose,
  onAddToTrip,
}) => {
  if (!place) return null;

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${place.name} ${place.address || ''}`
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-[#E4E8E5] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E4E8E5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F5C4D] bg-[#E3F1ED] px-2.5 py-0.5 rounded-full">
                {place.category === 'mosque' ? 'Mosque' : 'Halal Food'}
              </span>
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {place.statusText}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#14211F] mt-1.5">{place.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#5E6E6A] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Info */}
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-3 text-sm text-[#5E6E6A]">
            <MapPin className="w-4 h-4 text-[#0F5C4D] shrink-0" />
            <span>{place.address || `${place.distance} from your current location`}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#5E6E6A]">
            <Clock className="w-4 h-4 text-[#0F5C4D] shrink-0" />
            <span>{place.timeInfo} away</span>
          </div>

          {place.description && (
            <p className="text-sm text-[#14211F] leading-relaxed bg-[#F7F5EF] p-3.5 rounded-2xl border border-[#E4E8E5]">
              {place.description}
            </p>
          )}

          {/* Tags */}
          <div>
            <div className="text-xs font-semibold text-[#5E6E6A] mb-2 uppercase tracking-wider">
              Features & Amenities
            </div>
            <div className="flex flex-wrap gap-1.5">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-[#E3F1ED] text-[#0F5C4D] text-xs font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={openGoogleMaps}
            className="w-full py-3 px-4 rounded-xl bg-[#0F5C4D] hover:bg-[#0A4237] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>Start Navigation</span>
          </button>

          {onAddToTrip && (
            <button
              onClick={() => {
                onAddToTrip(place);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F7F5EF] hover:bg-[#E4E8E5] text-[#14211F] font-semibold text-sm transition-colors cursor-pointer"
            >
              Add to today's trip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
