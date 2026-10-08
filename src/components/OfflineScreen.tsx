import React, { useState } from 'react';
import { ChevronLeft, WifiOff, Check, Download, RefreshCw } from 'lucide-react';
import { LocationData } from '../types';
import { OfflinePackMeta, updateOfflinePackMeta } from '../utils/storage';

interface OfflineScreenProps {
  location: LocationData;
  offlineMeta: OfflinePackMeta;
  onBack: () => void;
  onPackUpdated: (newTimestamp: string) => void;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({
  location,
  offlineMeta,
  onBack,
  onPackUpdated,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const cityName = location.name.split(',')[0];

  const handleUpdatePack = () => {
    setIsUpdating(true);
    setTimeout(() => {
      const newTimestamp = updateOfflinePackMeta();
      setIsUpdating(false);
      setSuccessToast(true);
      onPackUpdated(newTimestamp);
      setTimeout(() => setSuccessToast(false), 3000);
    }, 1200);
  };

  const packItems = [
    {
      title: 'Qibla compass',
      detail: 'Works without internet',
    },
    {
      title: 'Prayer times',
      detail: 'Saved for 30 days',
    },
    {
      title: 'Mosque map',
      detail: `${cityName} · ${offlineMeta.mosqueSizeMb} MB`,
    },
    {
      title: 'Halal places',
      detail: `${cityName} · ${offlineMeta.halalSizeMb} MB`,
    },
    {
      title: 'Trip plan',
      detail: 'Saved on this phone',
    },
  ];

  return (
    <div className="p-4 sm:p-5 flex flex-col space-y-4 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white border border-[#E4E8E5] flex items-center justify-center text-[#14211F] hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[#14211F]">Offline mode</h1>
      </div>

      {/* Hero Card */}
      <div className="bg-[#0F5C4D] rounded-3xl p-6 text-white text-center shadow-md relative overflow-hidden">
        {/* Subtle crescent arch */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full border border-white/10 pointer-events-none" />

        {/* Wifi off circle */}
        <div className="w-14 h-14 rounded-full bg-[#0A4237] border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#C9A24B]">
          <WifiOff className="w-6 h-6 text-[#C9A24B]" />
        </div>

        <h2 className="text-xl font-extrabold text-white mb-1.5">
          You're ready for {cityName}
        </h2>
        <p className="text-xs sm:text-sm text-white/80 max-w-xs mx-auto leading-relaxed">
          Download once on Wi-Fi. Everything below then works with no signal.
        </p>
      </div>

      {/* Checklist Card */}
      <div className="bg-white rounded-2xl border border-[#E4E8E5] divide-y divide-[#E4E8E5] overflow-hidden shadow-2xs">
        {packItems.map((item, idx) => (
          <div key={idx} className="p-4 flex items-center gap-3.5">
            <div className="w-6 h-6 rounded-full bg-[#0F5C4D] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#14211F]">{item.title}</div>
              <div className="text-xs text-[#5E6E6A]">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toast feedback */}
      {successToast && (
        <div className="p-3 bg-[#E3F1ED] text-[#0F5C4D] rounded-xl text-xs font-semibold text-center border border-[#0F5C4D]/20 animate-fade-in">
          ✓ Offline pack updated successfully!
        </div>
      )}

      {/* Update Action Button */}
      <div className="pt-2">
        <button
          onClick={handleUpdatePack}
          disabled={isUpdating}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#0F5C4D] hover:bg-[#0A4237] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Updating offline pack...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-white" />
              <span>Update offline pack</span>
            </>
          )}
        </button>

        <p className="text-xs text-[#5E6E6A] text-center mt-3 font-medium">
          Last updated {offlineMeta.lastUpdated}
        </p>
      </div>
    </div>
  );
};
