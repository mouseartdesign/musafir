import React, { useState } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { LocationData, TripDay, TripStop } from '../types';
import { AddStopModal } from './AddStopModal';

interface TripScreenProps {
  location: LocationData;
  tripDays: TripDay[];
  onOpenAsk: () => void;
  onUpdateTripDays: (updated: TripDay[]) => void;
}

export const TripScreen: React.FC<TripScreenProps> = ({
  location,
  tripDays,
  onOpenAsk,
  onUpdateTripDays,
}) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const currentDay = tripDays.find((d) => d.dayNumber === selectedDayNumber) || tripDays[0];

  const handleAddStop = (newStopData: Omit<TripStop, 'id'>) => {
    const updated = tripDays.map((d) => {
      if (d.dayNumber === selectedDayNumber) {
        return {
          ...d,
          stops: [
            ...d.stops,
            {
              ...newStopData,
              id: `custom-stop-${Date.now()}`,
            },
          ],
        };
      }
      return d;
    });
    onUpdateTripDays(updated);
  };

  const handleDeleteStop = (stopId: string) => {
    const updated = tripDays.map((d) => {
      if (d.dayNumber === selectedDayNumber) {
        return {
          ...d,
          stops: d.stops.filter((s) => s.id !== stopId),
        };
      }
      return d;
    });
    onUpdateTripDays(updated);
  };

  const getStopIcon = (type: TripStop['type']) => {
    switch (type) {
      case 'prayer':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#FBF3DE] text-[#C9A24B] flex items-center justify-center shrink-0">
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
          <div className="w-9 h-9 rounded-xl bg-[#E3F1ED] text-[#0F5C4D] flex items-center justify-center shrink-0">
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
          </div>
        );
      case 'sightseeing':
      case 'freetime':
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-[#E3F1ED] text-[#0F5C4D] flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-5 flex flex-col space-y-4 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <h1 className="text-2xl font-extrabold text-[#14211F]">Your trip</h1>
          <div className="text-xs text-[#5E6E6A] font-medium mt-0.5">
            {location.name.split(',')[0]} · {tripDays.length} days
          </div>
        </div>

        {/* Ask Musafir Pill */}
        <button
          onClick={onOpenAsk}
          className="py-1.5 px-3.5 rounded-full bg-[#0F5C4D] hover:bg-[#0A4237] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
          <span>Ask</span>
        </button>
      </div>

      {/* Day Switcher Tabs */}
      <div className="flex items-center gap-2">
        {tripDays.map((d) => (
          <button
            key={d.dayNumber}
            onClick={() => setSelectedDayNumber(d.dayNumber)}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDayNumber === d.dayNumber
                ? 'bg-[#0F5C4D] text-white shadow-xs'
                : 'bg-white text-[#5E6E6A] border border-[#E4E8E5] hover:text-[#14211F]'
            }`}
          >
            Day {d.dayNumber}
          </button>
        ))}
      </div>

      {/* Prayer Breaks Banner */}
      <div className="p-2.5 rounded-xl bg-[#E3F1ED] text-[#0F5C4D] flex items-center gap-2 text-xs font-medium border border-[#0F5C4D]/10">
        <svg
          className="w-3.5 h-3.5 fill-current shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
        <span>Prayer breaks are added for you</span>
      </div>

      {/* Timeline List */}
      <div className="space-y-3 pt-1 relative">
        {currentDay.stops.map((stop) => (
          <div key={stop.id} className="flex items-center gap-3">
            {/* Left Time Column (fixed width for vertical alignment) */}
            <div className="w-16 shrink-0 text-right text-xs font-semibold text-[#5E6E6A]">
              {stop.time}
            </div>

            {/* Right Activity Card */}
            <div className="flex-1 p-3.5 bg-white rounded-2xl border border-[#E4E8E5] shadow-2xs flex items-center justify-between group hover:border-[#0F5C4D]/30 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                {getStopIcon(stop.type)}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#14211F] truncate">
                    {stop.title}
                  </div>
                  <div className="text-xs text-[#5E6E6A] truncate">
                    {stop.subtitle}
                  </div>
                </div>
              </div>

              {/* Delete action if custom */}
              {stop.id.startsWith('custom') && (
                <button
                  onClick={() => handleDeleteStop(stop.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-opacity cursor-pointer"
                  title="Remove stop"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
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

      {/* Add Stop Modal */}
      <AddStopModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStop={handleAddStop}
      />
    </div>
  );
};
