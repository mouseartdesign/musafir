import React, { useState, useEffect } from 'react';
import { Check, Compass, RotateCw } from 'lucide-react';
import { LocationData } from '../types';
import { calculateQiblaDirection, calculateDistanceToKaaba } from '../utils/qibla';

interface QiblaScreenProps {
  location: LocationData;
}

export const QiblaScreen: React.FC<QiblaScreenProps> = ({ location }) => {
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [sensorActive, setSensorActive] = useState<boolean>(false);
  const [sensorPermissionNeeded, setSensorPermissionNeeded] = useState<boolean>(false);
  const [manualHeading, setManualHeading] = useState<number>(0);

  // Exact bearing from current location to Kaaba
  const qiblaAngle = calculateQiblaDirection(location.lat, location.lng);
  const distanceKm = calculateDistanceToKaaba(location.lat, location.lng);

  // Effective device heading (either from sensor or manual simulation)
  const currentHeading = sensorActive ? deviceHeading : manualHeading;

  // The arrow rotation relative to phone top: (qiblaAngle - currentHeading + 360) % 360
  // When currentHeading === qiblaAngle, diff is 0 => arrow points straight UP (0 deg)
  const relativeAngle = ((qiblaAngle - currentHeading) % 360 + 360) % 360;

  // Is aligned within 5 degrees
  const isAligned = Math.abs(relativeAngle) <= 5 || Math.abs(relativeAngle - 360) <= 5;

  // Setup device orientation listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;

      // iOS compass heading
      if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
        heading = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        // Android / standard compass
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null && !isNaN(heading)) {
        setDeviceHeading(Math.round(heading));
        setSensorActive(true);
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      // Check if iOS 13+ permission request is needed
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        setSensorPermissionNeeded(true);
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
        window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true);
    };
  }, []);

  const requestIosPermission = async () => {
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setSensorPermissionNeeded(false);
          const handleOrientation = (e: DeviceOrientationEvent) => {
            if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
              setDeviceHeading(Math.round((e as any).webkitCompassHeading));
              setSensorActive(true);
            }
          };
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      }
    } catch (err) {
      console.warn('Device orientation permission rejected:', err);
    }
  };

  return (
    <div className="p-4 sm:p-5 flex flex-col items-center justify-between min-h-[calc(100vh-80px)] text-center animate-fade-in">
      {/* Top Heading */}
      <div className="w-full text-left pt-1">
        <h1 className="text-2xl font-extrabold text-[#14211F]">Qibla</h1>
        <p className="text-sm text-[#5E6E6A] mt-1">
          Hold your phone flat and turn until the arrow points up.
        </p>
      </div>

      {/* Main Compass Dial */}
      <div className="relative my-6 flex flex-col items-center justify-center">
        {/* iOS permission alert if required */}
        {sensorPermissionNeeded && (
          <div className="mb-4">
            <button
              onClick={requestIosPermission}
              className="py-2 px-4 rounded-xl bg-[#0F5C4D] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              Enable Compass Sensor
            </button>
          </div>
        )}

        {/* Outer Circular Dial Container */}
        <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-white border border-[#E4E8E5] shadow-sm relative flex items-center justify-center overflow-hidden">
          {/* North marker pill at top */}
          <div className="absolute top-2 w-8 h-3.5 rounded-full bg-[#14211F] flex items-center justify-center z-20">
            <span className="text-[9px] font-extrabold text-white">N</span>
          </div>

          {/* Compass Dial Face with rotation */}
          <div
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#E3F1ED] flex items-center justify-center relative transition-transform duration-200 ease-out"
            style={{
              transform: `rotate(${relativeAngle}deg)`,
            }}
          >
            {/* Emerald Qibla Arrow */}
            <div className="relative flex flex-col items-center">
              {/* Arrow Head */}
              <div
                className="w-0 h-0 border-l-[22px] border-l-transparent border-r-[22px] border-r-transparent border-b-[54px] border-b-[#0F5C4D] filter drop-shadow-sm"
                style={{
                  transform: 'translateY(-12px)',
                }}
              />
              {/* Gold Center Dot */}
              <div className="w-4 h-4 rounded-full bg-[#C9A24B] border-2 border-white mt-1 shadow-xs" />
            </div>
          </div>
        </div>

        {/* Manual calibration slider for testing on desktop or when sensors are inactive */}
        {!sensorActive && (
          <div className="w-64 mt-4 px-2">
            <div className="flex items-center justify-between text-[11px] text-[#5E6E6A] mb-1">
              <span>Simulate turning phone:</span>
              <span className="font-semibold">{manualHeading}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={manualHeading}
              onChange={(e) => setManualHeading(Number(e.target.value))}
              className="w-full accent-[#0F5C4D] cursor-pointer"
            />
            <button
              onClick={() => setManualHeading(qiblaAngle)}
              className="text-[11px] text-[#0F5C4D] font-medium hover:underline mt-1"
            >
              Align to Makkah ({qiblaAngle}°)
            </button>
          </div>
        )}
      </div>

      {/* Degree & Distance readout */}
      <div className="space-y-1.5 my-2">
        <div className="text-4xl font-extrabold text-[#14211F] tracking-tight">
          {qiblaAngle}°
        </div>
        <div className="text-sm text-[#5E6E6A]">
          Makkah is about {distanceKm.toLocaleString()} km away
        </div>

        {/* Facing Status Badge */}
        <div className="pt-2">
          {isAligned ? (
            <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-[#0F5C4D] text-white text-sm font-semibold shadow-xs animate-bounce-short">
              <Check className="w-4 h-4 text-white" />
              <span>You're facing Makkah</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-[#E3F1ED] text-[#0F5C4D] text-xs font-semibold">
              <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>
                {relativeAngle > 180
                  ? `Turn ${(360 - relativeAngle)}° left`
                  : `Turn ${relativeAngle}° right`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting Message Box */}
      <div className="w-full mt-4 p-4 rounded-2xl bg-white border border-[#E4E8E5] flex items-center gap-3.5 text-left shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-[#E3F1ED] flex items-center justify-center shrink-0 text-[#0F5C4D]">
          <Compass className="w-5 h-5 text-[#0F5C4D]" />
        </div>
        <p className="text-xs text-[#5E6E6A] leading-relaxed">
          Arrow jumping? Move away from metal and wave your phone in a figure 8.
        </p>
      </div>
    </div>
  );
};
