import React from 'react';
import { MapPin, Check } from 'lucide-react';

interface WelcomeScreenProps {
  onAllowLocation: () => void;
  onChooseCity: () => void;
  isLocating?: boolean;
  locationError?: string | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onAllowLocation,
  onChooseCity,
  isLocating = false,
  locationError = null,
}) => {
  return (
    <div className="min-h-screen bg-[#0A4237] text-white flex flex-col justify-between p-6 relative overflow-hidden select-none">
      {/* Decorative Islamic geometric background arc lines */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#0F5C4D]/60 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#0F5C4D]/40 blur-2xl pointer-events-none" />

      {/* Decorative crescent curves */}
      <div className="absolute top-12 -right-20 w-72 h-72 rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute top-24 -right-10 w-72 h-72 rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute bottom-32 -left-20 w-80 h-80 rounded-full border border-white/5 pointer-events-none" />

      {/* Top Status Space */}
      <div className="w-full flex justify-between items-center text-xs text-white/50 pt-2 pb-6 z-10 font-mono">
        <span>9:41</span>
        <span>LTE 92%</span>
      </div>

      {/* Middle Brand and Value Props */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 text-center max-w-sm mx-auto">
        {/* Crescent Moon Logo Badge */}
        <div className="w-20 h-20 rounded-2xl bg-[#0F5C4D] border border-[#C9A24B]/40 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
          <svg
            className="w-10 h-10 text-white fill-current"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold tracking-wider text-white mb-2">
          MUSAFIR
        </h1>
        <p className="text-base text-[#E3F1ED] font-normal mb-8">
          Travel far. Pray anywhere.
        </p>

        {/* Feature List */}
        <div className="w-full space-y-4 text-left px-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#062A23] border border-white/10 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[#C9A24B]" />
            </div>
            <span className="text-sm font-medium text-white/95">
              Qibla and prayer times, anywhere
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#062A23] border border-white/10 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[#C9A24B]" />
            </div>
            <span className="text-sm font-medium text-white/95">
              Mosques and halal food nearby
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#062A23] border border-white/10 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[#C9A24B]" />
            </div>
            <span className="text-sm font-medium text-white/95">
              Works offline when signal drops
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-3 pb-4 z-10">
        {locationError && (
          <div className="w-full py-2 px-3 rounded-xl bg-[#062A23] border border-[#C9A24B]/30 text-xs text-[#E3F1ED] text-center">
            {locationError}
          </div>
        )}

        <button
          onClick={onAllowLocation}
          disabled={isLocating}
          className="w-full py-3.5 px-6 rounded-full bg-[#C9A24B] hover:bg-[#d8b056] active:scale-[0.99] text-[#14211F] font-semibold text-base flex items-center justify-center gap-2.5 shadow-md shadow-black/25 transition-all cursor-pointer"
        >
          <MapPin className="w-5 h-5 text-[#14211F]" />
          <span>{isLocating ? 'Detecting location...' : 'Allow location'}</span>
        </button>

        <button
          onClick={onChooseCity}
          className="w-full py-2.5 text-center text-sm font-medium text-white/90 hover:text-white transition-colors cursor-pointer"
        >
          Choose a city instead
        </button>

        <p className="text-xs text-white/45 text-center font-normal mt-1">
          Used only to find Qibla and prayer times.
        </p>
      </div>
    </div>
  );
};
