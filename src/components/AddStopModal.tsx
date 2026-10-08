import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TripStop } from '../types';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStop: (stop: Omit<TripStop, 'id'>) => void;
}

export const AddStopModal: React.FC<AddStopModalProps> = ({
  isOpen,
  onClose,
  onAddStop,
}) => {
  const [time, setTime] = useState('2:00 PM');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState<'sightseeing' | 'prayer' | 'food' | 'freetime'>('sightseeing');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddStop({
      time,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Activity',
      type,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-[#E4E8E5]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E8E5]">
          <h2 className="text-lg font-bold text-[#14211F]">Add a Stop</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#5E6E6A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5E6E6A] mb-1">
              Category
            </label>
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
                Free Time
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E6E6A] mb-1">
              Time
            </label>
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
            <label className="block text-xs font-semibold text-[#5E6E6A] mb-1">
              Stop Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dubai Frame, Asr Prayer, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E8E5] bg-[#F7F5EF] text-sm text-[#14211F] focus:outline-none focus:border-[#0F5C4D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E6E6A] mb-1">
              Details / Duration / Location
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Sightseeing · 1 h 30 min"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E8E5] bg-[#F7F5EF] text-sm text-[#14211F] focus:outline-none focus:border-[#0F5C4D]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#0F5C4D] hover:bg-[#0A4237] text-white font-semibold text-sm cursor-pointer shadow-xs transition-colors"
            >
              Add Stop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
