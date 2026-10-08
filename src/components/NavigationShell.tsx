import React from 'react';
import { Home, Compass, MapPin, Calendar, Sparkles } from 'lucide-react';

export type TabType = 'home' | 'qibla' | 'explore' | 'trip';

interface NavigationShellProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenAsk?: () => void;
  children: React.ReactNode;
}

export const NavigationShell: React.FC<NavigationShellProps> = ({
  currentTab,
  onTabChange,
  onOpenAsk,
  children,
}) => {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#F7F5EF] text-[#14211F] flex flex-col justify-between items-center selection:bg-[#E3F1ED] selection:text-[#0F5C4D] overflow-x-hidden">
      {/* Centered responsive container - provides exact mobile layout with seamless desktop enhancement */}
      <div className="w-full max-w-md sm:max-w-lg min-h-screen min-h-[100dvh] bg-[#F7F5EF] flex flex-col relative pb-20 shadow-xl shadow-black/5 overflow-x-hidden">
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>

        {/* Bottom Navigation Bar */}
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-lg bg-white border-t border-[#E4E8E5] px-4 py-2 z-40 flex items-center justify-around shadow-sm"
          role="navigation"
          aria-label="Main Navigation"
        >
          {/* Home */}
          <button
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'home' ? 'text-[#0F5C4D]' : 'text-[#5E6E6A] hover:text-[#14211F]'
            }`}
          >
            <Home className="w-5 h-5 mb-1" strokeWidth={currentTab === 'home' ? 2.3 : 1.8} />
            <span
              className={`text-[11px] leading-tight ${
                currentTab === 'home' ? 'font-bold' : 'font-medium'
              }`}
            >
              Home
            </span>
          </button>

          {/* Qibla */}
          <button
            onClick={() => onTabChange('qibla')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'qibla' ? 'text-[#0F5C4D]' : 'text-[#5E6E6A] hover:text-[#14211F]'
            }`}
          >
            {/* Custom Qibla polygon compass icon matching Figma */}
            <div className="w-5 h-5 mb-1 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={currentTab === 'qibla' ? 2.3 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <polygon points="12 2 19 21 12 17 5 21 12 2" />
              </svg>
            </div>
            <span
              className={`text-[11px] leading-tight ${
                currentTab === 'qibla' ? 'font-bold' : 'font-medium'
              }`}
            >
              Qibla
            </span>
          </button>

          {/* Explore */}
          <button
            onClick={() => onTabChange('explore')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'explore' ? 'text-[#0F5C4D]' : 'text-[#5E6E6A] hover:text-[#14211F]'
            }`}
          >
            <div className="w-5 h-5 mb-1 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={currentTab === 'explore' ? 2.3 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span
              className={`text-[11px] leading-tight ${
                currentTab === 'explore' ? 'font-bold' : 'font-medium'
              }`}
            >
              Explore
            </span>
          </button>

          {/* Trip */}
          <button
            onClick={() => onTabChange('trip')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer ${
              currentTab === 'trip' ? 'text-[#0F5C4D]' : 'text-[#5E6E6A] hover:text-[#14211F]'
            }`}
          >
            <Calendar className="w-5 h-5 mb-1" strokeWidth={currentTab === 'trip' ? 2.3 : 1.8} />
            <span
              className={`text-[11px] leading-tight ${
                currentTab === 'trip' ? 'font-bold' : 'font-medium'
              }`}
            >
              Trip
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
};
