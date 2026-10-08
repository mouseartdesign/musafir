/**
 * MUSAFIR - Muslim Travel Companion
 * "Travel far. Pray anywhere."
 *
 * Source of Truth: Supplied Figma Design System
 */

import React, { useState, useEffect, useMemo } from 'react';
import { LocationData, Place, TripDay } from './types';
import { DEFAULT_LOCATION, POPULAR_CITIES } from './data/cities';
import { calculatePrayerTimes } from './utils/prayerTimes';
import {
  getHasOnboarded,
  setHasOnboarded,
  getSavedLocation,
  saveLocation,
  getCalculationMethod,
  saveCalculationMethod,
  getAdhanReminderEnabled,
  saveAdhanReminderEnabled,
  getPrayerNotifications,
  savePrayerNotifications,
  getOfflinePackMeta,
  getTripDays,
  saveTripDays,
} from './utils/storage';

import { NavigationShell, TabType } from './components/NavigationShell';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CitySelectModal } from './components/CitySelectModal';
import { HomeScreen } from './components/HomeScreen';
import { QiblaScreen } from './components/QiblaScreen';
import { PrayerTimesScreen } from './components/PrayerTimesScreen';
import { ExploreScreen } from './components/ExploreScreen';
import { TripScreen } from './components/TripScreen';
import { OfflineScreen } from './components/OfflineScreen';
import { AskMusafirScreen } from './components/AskMusafirScreen';

type SubScreenType = 'none' | 'prayer-times' | 'offline' | 'ask';

export default function App() {
  // Onboarding state
  const [isOnboarded, setIsOnboardedState] = useState<boolean>(() => getHasOnboarded());
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Active navigation
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [subScreen, setSubScreen] = useState<SubScreenType>('none');
  const [exploreCategory, setExploreCategory] = useState<'mosque' | 'halal'>('halal');

  // Location & Settings
  const [location, setLocation] = useState<LocationData>(() => getSavedLocation());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [calculationMethod, setCalculationMethod] = useState<string>(() => getCalculationMethod());
  const [adhanReminderEnabled, setAdhanReminderEnabled] = useState<boolean>(() =>
    getAdhanReminderEnabled()
  );
  const [prayerNotifications, setPrayerNotifications] = useState<Record<string, boolean>>(() =>
    getPrayerNotifications()
  );

  // Dynamic place counts for Home screen
  const [placeCounts, setPlaceCounts] = useState({
    mosqueSummary: '3 within 1 km',
    halalSummary: '12 places nearby',
  });

  // Offline network detection
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline Pack & Trip Data
  const [offlineMeta, setOfflineMeta] = useState(() => getOfflinePackMeta(location.name));
  const [tripDays, setTripDays] = useState<TripDay[]>(() => getTripDays());

  // Clock tick to refresh countdown
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  // Recalculate prayer times whenever location, calculationMethod, selectedDate, or time tick changes
  const prayerTimes = useMemo(() => {
    return calculatePrayerTimes(location.lat, location.lng, selectedDate, calculationMethod);
  }, [location.lat, location.lng, selectedDate, calculationMethod, nowTick]);

  // Fetch real counts for the home screen
  useEffect(() => {
    let isCancelled = false;
    fetch('/api/places/counts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: location.lat, lng: location.lng }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.mosqueSummary && data.halalSummary) {
          setPlaceCounts({
            mosqueSummary: data.mosqueSummary,
            halalSummary: data.halalSummary,
          });
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [location.lat, location.lng]);

  // Handlers for location selection
  const handleSelectCity = (city: LocationData) => {
    setLocation(city);
    saveLocation(city);
    setOfflineMeta(getOfflinePackMeta(city.name));
    setLocationError(null);
    if (!isOnboarded) {
      setIsOnboardedState(true);
      setHasOnboarded(true);
    }
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsCityModalOpen(true);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;

        // Find nearest city in database or label current
        let closest = POPULAR_CITIES[0];
        let minDistance = Number.MAX_VALUE;

        for (const city of POPULAR_CITIES) {
          const d = Math.hypot(city.lat - latitude, city.lng - longitude);
          if (d < minDistance) {
            minDistance = d;
            closest = city;
          }
        }

        const userLocation: LocationData = {
          id: `gps-${Date.now()}`,
          name: minDistance < 0.6 ? closest.name : 'Current Location',
          country: minDistance < 0.6 ? closest.country : '',
          lat: latitude,
          lng: longitude,
          timezone: closest.timezone,
        };

        handleSelectCity(userLocation);
        setIsCityModalOpen(false);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        setLocationError('Location access is off. Choose your city instead.');
        setIsCityModalOpen(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAllowLocationOnboarding = () => {
    handleUseCurrentLocation();
  };

  // Calculation method change
  const handleMethodChange = (methodId: string) => {
    setCalculationMethod(methodId);
    saveCalculationMethod(methodId);
  };

  // Adhan reminders
  const handleToggleAdhanReminder = () => {
    const next = !adhanReminderEnabled;
    setAdhanReminderEnabled(next);
    saveAdhanReminderEnabled(next);
  };

  const handleTogglePrayerNotif = (prayer: string) => {
    const next = {
      ...prayerNotifications,
      [prayer]: !prayerNotifications[prayer],
    };
    setPrayerNotifications(next);
    savePrayerNotifications(next);
  };

  // Trip changes
  const handleUpdateTripDays = (newDays: TripDay[]) => {
    setTripDays(newDays);
    saveTripDays(newDays);
  };

  const handleAddPlaceToTrip = (place: Place) => {
    const updated = tripDays.map((d) => {
      if (d.dayNumber === 1) {
        return {
          ...d,
          stops: [
            ...d.stops,
            {
              id: `custom-stop-${Date.now()}`,
              time: '2:30 PM',
              title: place.name,
              subtitle: `${place.distance} · ${
                place.category === 'mosque' ? 'Prayer visit' : 'Halal dining'
              }`,
              type: place.category === 'mosque' ? ('prayer' as const) : ('food' as const),
              distance: place.distance,
            },
          ],
        };
      }
      return d;
    });
    handleUpdateTripDays(updated);
  };

  // Navigation tab change resets subscreen
  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    setSubScreen('none');
  };

  // If user hasn't onboarded yet, show Welcome screen (Screen 1)
  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-[#0A4237] flex items-center justify-center">
        <div className="w-full max-w-md min-h-screen">
          <WelcomeScreen
            onAllowLocation={handleAllowLocationOnboarding}
            onChooseCity={() => setIsCityModalOpen(true)}
            isLocating={isLocating}
            locationError={locationError}
          />
          <CitySelectModal
            isOpen={isCityModalOpen}
            onClose={() => setIsCityModalOpen(false)}
            onSelectCity={handleSelectCity}
            currentCityId={location.id}
            onUseCurrentLocation={handleUseCurrentLocation}
            isLocating={isLocating}
          />
        </div>
      </div>
    );
  }

  // Render subscreen or active main tab
  const renderContent = () => {
    if (subScreen === 'prayer-times') {
      return (
        <PrayerTimesScreen
          location={location}
          prayerTimes={prayerTimes}
          onBack={() => setSubScreen('none')}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          calculationMethod={calculationMethod}
          onMethodChange={handleMethodChange}
          adhanReminderEnabled={adhanReminderEnabled}
          onToggleAdhanReminder={handleToggleAdhanReminder}
          prayerNotifications={prayerNotifications}
          onTogglePrayerNotif={handleTogglePrayerNotif}
        />
      );
    }

    if (subScreen === 'offline') {
      return (
        <OfflineScreen
          location={location}
          offlineMeta={offlineMeta}
          onBack={() => setSubScreen('none')}
          onPackUpdated={(newTime) => {
            setOfflineMeta((prev) => ({ ...prev, lastUpdated: newTime }));
          }}
        />
      );
    }

    if (subScreen === 'ask') {
      return (
        <AskMusafirScreen
          location={location}
          prayerTimes={prayerTimes}
          onBack={() => setSubScreen('none')}
          onNavigateExplore={(cat) => {
            setExploreCategory(cat);
            setCurrentTab('explore');
            setSubScreen('none');
          }}
          onNavigateTrip={() => {
            setCurrentTab('trip');
            setSubScreen('none');
          }}
          onSelectPlace={handleAddPlaceToTrip}
        />
      );
    }

    // Main 4 destinations
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            location={location}
            prayerTimes={prayerTimes}
            onOpenCitySelect={() => setIsCityModalOpen(true)}
            onOpenAsk={() => setSubScreen('ask')}
            onOpenPrayerTimes={() => setSubScreen('prayer-times')}
            onOpenOffline={() => setSubScreen('offline')}
            onNavigateTab={(tab, extra) => {
              if (extra?.exploreCategory) {
                setExploreCategory(extra.exploreCategory);
              }
              setCurrentTab(tab);
            }}
            mosqueCountSummary={placeCounts.mosqueSummary}
            halalCountSummary={placeCounts.halalSummary}
            isOffline={!isOnline}
          />
        );

      case 'qibla':
        return <QiblaScreen location={location} />;

      case 'explore':
        return (
          <ExploreScreen
            location={location}
            defaultCategory={exploreCategory}
            onAddToTrip={handleAddPlaceToTrip}
          />
        );

      case 'trip':
        return (
          <TripScreen
            location={location}
            tripDays={tripDays}
            onOpenAsk={() => setSubScreen('ask')}
            onUpdateTripDays={handleUpdateTripDays}
          />
        );

      default:
        return null;
    }
  };

  return (
    <NavigationShell
      currentTab={currentTab}
      onTabChange={handleTabChange}
      onOpenAsk={() => setSubScreen('ask')}
    >
      {renderContent()}

      {/* Global City Selector Modal */}
      <CitySelectModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        onSelectCity={handleSelectCity}
        currentCityId={location.id}
        onUseCurrentLocation={handleUseCurrentLocation}
        isLocating={isLocating}
      />
    </NavigationShell>
  );
}
