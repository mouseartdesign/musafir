import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Bell, BellOff, X } from 'lucide-react';
import { LocationData, PrayerTimesData, PrayerName } from '../types';
import { CALCULATION_METHODS } from '../utils/prayerTimes';

interface PrayerTimesScreenProps {
  location: LocationData;
  prayerTimes: PrayerTimesData;
  onBack: () => void;
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
  calculationMethod: string;
  onMethodChange: (methodId: string) => void;
  adhanReminderEnabled: boolean;
  onToggleAdhanReminder: () => void;
  prayerNotifications: Record<string, boolean>;
  onTogglePrayerNotif: (prayer: string) => void;
}

export const PrayerTimesScreen: React.FC<PrayerTimesScreenProps> = ({
  location,
  prayerTimes,
  onBack,
  selectedDate,
  onDateChange,
  calculationMethod,
  onMethodChange,
  adhanReminderEnabled,
  onToggleAdhanReminder,
  prayerNotifications,
  onTogglePrayerNotif,
}) => {
  const [showMethodModal, setShowMethodModal] = useState(false);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  const methodName = CALCULATION_METHODS[calculationMethod]?.name || 'Muslim World League';

  const prayerRows: { name: PrayerName; time: string; isNext: boolean; hasBell: boolean }[] = [
    { name: 'Fajr', time: prayerTimes.fajr, isNext: prayerTimes.nextPrayer === 'Fajr', hasBell: true },
    { name: 'Sunrise', time: prayerTimes.sunrise, isNext: false, hasBell: true },
    { name: 'Dhuhr', time: prayerTimes.dhuhr, isNext: prayerTimes.nextPrayer === 'Dhuhr', hasBell: true },
    { name: 'Asr', time: prayerTimes.asr, isNext: prayerTimes.nextPrayer === 'Asr', hasBell: true },
    { name: 'Maghrib', time: prayerTimes.maghrib, isNext: prayerTimes.nextPrayer === 'Maghrib', hasBell: true },
    { name: 'Isha', time: prayerTimes.isha, isNext: prayerTimes.nextPrayer === 'Isha', hasBell: true },
  ];

  return (
    <div className="p-4 sm:p-5 flex flex-col space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white border border-[#E4E8E5] flex items-center justify-center text-[#14211F] hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[#14211F]">Prayer times</h1>
      </div>

      {/* Date Navigation Box */}
      <div className="p-4 bg-white rounded-2xl border border-[#E4E8E5] text-center shadow-2xs">
        <div className="flex items-center justify-between mb-0.5">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg hover:bg-[#F7F5EF] text-[#5E6E6A] transition-colors cursor-pointer"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-base font-bold text-[#14211F]">
            {prayerTimes.readableDate}
          </div>
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg hover:bg-[#F7F5EF] text-[#5E6E6A] transition-colors cursor-pointer"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-[#5E6E6A]">{location.name}</div>
      </div>

      {/* Prayer Timetable List */}
      <div className="bg-white rounded-2xl border border-[#E4E8E5] divide-y divide-[#E4E8E5] overflow-hidden shadow-2xs">
        {prayerRows.map((row) => {
          const isNotifOn = prayerNotifications[row.name] !== false;

          return (
            <div
              key={row.name}
              className={`p-4 flex items-center justify-between transition-colors ${
                row.isNext ? 'bg-[#E3F1ED]/40' : ''
              }`}
            >
              {/* Left Prayer Name & Next Tag */}
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold text-[#14211F]">{row.name}</span>
                {row.isNext && (
                  <span className="px-2 py-0.5 rounded-full bg-[#0F5C4D] text-white text-[10px] font-bold">
                    Next
                  </span>
                )}
              </div>

              {/* Right Time & Notification Bell */}
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-[#14211F]">{row.time}</span>
                <button
                  onClick={() => onTogglePrayerNotif(row.name)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isNotifOn ? 'text-[#0F5C4D] hover:bg-[#E3F1ED]' : 'text-slate-300 hover:text-slate-500'
                  }`}
                  aria-label={`Toggle reminder for ${row.name}`}
                >
                  {isNotifOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adhan Reminder Card */}
      <div className="p-4 rounded-2xl bg-white border border-[#E4E8E5] flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E3F1ED] flex items-center justify-center shrink-0 text-[#0F5C4D]">
            <Bell className="w-5 h-5 text-[#0F5C4D]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#14211F]">Adhan reminder</div>
            <div className="text-xs text-[#5E6E6A]">10 minutes before each prayer</div>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={onToggleAdhanReminder}
          className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
            adhanReminderEnabled ? 'bg-[#0F5C4D]' : 'bg-slate-300'
          }`}
          role="switch"
          aria-checked={adhanReminderEnabled}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
              adhanReminderEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Calculation Method Row */}
      <div className="flex items-center justify-between px-1 text-xs text-[#5E6E6A]">
        <span>
          Calculation: <span className="text-[#14211F] font-semibold">{methodName}</span>
        </span>
        <button
          onClick={() => setShowMethodModal(true)}
          className="text-[#0F5C4D] font-bold hover:underline cursor-pointer"
        >
          Change
        </button>
      </div>

      {/* Calculation Method Selection Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-[#E4E8E5]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E8E5] mb-3">
              <h3 className="text-base font-bold text-[#14211F]">Calculation Method</h3>
              <button
                onClick={() => setShowMethodModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-[#5E6E6A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {Object.values(CALCULATION_METHODS).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onMethodChange(m.id);
                    setShowMethodModal(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                    calculationMethod === m.id
                      ? 'bg-[#E3F1ED] text-[#0F5C4D] border border-[#0F5C4D]'
                      : 'hover:bg-slate-50 text-[#14211F] border border-[#E4E8E5]'
                  }`}
                >
                  <span>{m.name}</span>
                  {calculationMethod === m.id && <span className="text-xs font-bold">Selected</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
