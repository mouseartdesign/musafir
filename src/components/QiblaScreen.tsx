import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check, Compass, RotateCw, AlertTriangle, Navigation, RefreshCw, Smartphone } from 'lucide-react';
import { LocationData } from '../types';
import {
  calculateQiblaDirection,
  calculateDistanceToKaaba,
  getCardinalDirection,
  normalizeAngle,
} from '../utils/qibla';

interface QiblaScreenProps {
  location: LocationData;
}

type SensorStatus = 'checking' | 'active' | 'needs_permission' | 'unsupported' | 'denied';

/**
 * Calculates screen orientation angle (0, 90, 180, 270)
 */
function getScreenOrientationAngle(): number {
  if (typeof window === 'undefined') return 0;
  if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') {
    return window.screen.orientation.angle;
  }
  if (typeof (window as any).orientation === 'number') {
    return (window as any).orientation;
  }
  return 0;
}

/**
 * 3D tilt-compensated compass heading calculation from Euler angles (alpha, beta, gamma)
 * Accounts for 3D device tilt in space and screen rotation (portrait/landscape)
 */
function computeHeadingFromEuler(
  alpha: number,
  beta: number,
  gamma: number,
  screenAngle: number
): number {
  const degToRad = Math.PI / 180;
  const a = alpha * degToRad; // Z-axis rotation
  const b = beta * degToRad;  // X-axis rotation
  const c = gamma * degToRad; // Y-axis rotation

  // Top-of-screen unit vector in device coordinate system
  const s = screenAngle * degToRad;
  const ux = -Math.sin(s);
  const uy = Math.cos(s);

  // W3C Rotation matrix components for Z-X'-Y''
  const r11 = Math.cos(a) * Math.cos(c) - Math.sin(a) * Math.sin(b) * Math.sin(c);
  const r12 = -Math.sin(a) * Math.cos(b);
  const east = ux * r11 + uy * r12;

  const r21 = Math.sin(a) * Math.cos(c) + Math.cos(a) * Math.sin(b) * Math.sin(c);
  const r22 = Math.cos(a) * Math.cos(b);
  const north = ux * r21 + uy * r22;

  // Clockwise angle from North towards East
  let heading = Math.atan2(east, north) * (180 / Math.PI);
  return normalizeAngle(heading);
}

export const QiblaScreen: React.FC<QiblaScreenProps> = ({ location }) => {
  // Live GPS state
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isGettingGps, setIsGettingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Sensor state
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [continuousHeading, setContinuousHeading] = useState<number>(0);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('checking');
  const [sensorAccuracy, setSensorAccuracy] = useState<number | null>(null);
  const [isAbsoluteSensor, setIsAbsoluteSensor] = useState<boolean>(false);
  const [showCalibrationGuide, setShowCalibrationGuide] = useState<boolean>(false);
  const [manualHeading, setManualHeading] = useState<number>(0);

  // Filter ref for low-pass smoothing (exponential moving average on 2D unit vector)
  const filterRef = useRef<{
    x: number;
    y: number;
    continuousAngle: number;
    initialized: boolean;
  }>({
    x: 0,
    y: 1,
    continuousAngle: 0,
    initialized: false,
  });

  const isUsingAbsoluteRef = useRef<boolean>(false);
  const hasReceivedDataRef = useRef<boolean>(false);
  const lastVibratedRef = useRef<boolean>(false);
  const screenAngleRef = useRef<number>(0);

  // Effective coordinates: live device GPS preferred, falling back to selected location
  const currentLat = gpsCoords?.lat ?? location.lat;
  const currentLng = gpsCoords?.lng ?? location.lng;

  // Bearing to Kaaba calculated dynamically using spherical trigonometry
  const qiblaAngle = useMemo(() => {
    return calculateQiblaDirection(currentLat, currentLng);
  }, [currentLat, currentLng]);

  const distanceKm = useMemo(() => {
    return calculateDistanceToKaaba(currentLat, currentLng);
  }, [currentLat, currentLng]);

  // Effective heading (sensor or manual slider for desktop)
  const effectiveHeading = sensorStatus === 'active' ? deviceHeading : manualHeading;
  const effectiveContinuousHeading = sensorStatus === 'active' ? continuousHeading : manualHeading;

  // Relative Qibla angle: degrees clockwise from phone top to Kaaba
  // When effectiveHeading === qiblaAngle, relativeAngle is 0 (straight UP)
  const relativeAngle = normalizeAngle(qiblaAngle - effectiveHeading);

  // Continuous relative angle for buttery smooth needle rotation without 360 wrap glitch
  const continuousRelativeAngle = qiblaAngle - effectiveContinuousHeading;

  // Aligned within ±4 degrees
  const isAligned = Math.abs(relativeAngle) <= 4 || Math.abs(relativeAngle - 360) <= 4;

  // Haptic feedback when entering aligned state on supported mobile devices
  useEffect(() => {
    if (isAligned && !lastVibratedRef.current) {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(50);
        } catch (_) {}
      }
      lastVibratedRef.current = true;
    } else if (!isAligned) {
      lastVibratedRef.current = false;
    }
  }, [isAligned]);

  // Request high-accuracy GPS coordinates on mount
  const refreshGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setIsGettingGps(false);
      },
      (err) => {
        setIsGettingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('GPS permission was denied. Using chosen city.');
        } else {
          setGpsError('Unable to obtain GPS fix. Using chosen city.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    refreshGps();
  }, [refreshGps]);

  // Listen to screen orientation changes (portrait vs landscape)
  useEffect(() => {
    const handleOrientationChange = () => {
      screenAngleRef.current = getScreenOrientationAngle();
    };

    screenAngleRef.current = getScreenOrientationAngle();
    window.addEventListener('orientationchange', handleOrientationChange);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  // Process raw sensor readings with tilt compensation and exponential smoothing
  const processOrientation = useCallback((rawHeading: number, isAbsolute: boolean, accuracy?: number | null) => {
    hasReceivedDataRef.current = true;
    setSensorStatus('active');
    setIsAbsoluteSensor(isAbsolute);
    if (accuracy !== undefined) {
      setSensorAccuracy(accuracy);
    }

    // Convert raw heading to unit vector for smoothing
    const rad = (rawHeading * Math.PI) / 180;
    const targetX = Math.sin(rad);
    const targetY = Math.cos(rad);

    const f = filterRef.current;
    if (!f.initialized) {
      f.x = targetX;
      f.y = targetY;
      f.continuousAngle = rawHeading;
      f.initialized = true;
      setDeviceHeading(Math.round(rawHeading));
      setContinuousHeading(rawHeading);
      return;
    }

    // Exponential smoothing factor: 0.22 balances jitter suppression and responsive tracking
    const alphaFilter = 0.22;
    f.x = (1 - alphaFilter) * f.x + alphaFilter * targetX;
    f.y = (1 - alphaFilter) * f.y + alphaFilter * targetY;

    // Smoothed angle in [0, 360)
    const smoothedAngle = normalizeAngle((Math.atan2(f.x, f.y) * 180) / Math.PI);

    // Update continuous unwrapped angle along shortest angular distance to prevent 360° backwards spins
    let delta = smoothedAngle - normalizeAngle(f.continuousAngle);
    while (delta < -180) delta += 360;
    while (delta > 180) delta -= 360;
    f.continuousAngle += delta;

    setDeviceHeading(Math.round(smoothedAngle));
    setContinuousHeading(f.continuousAngle);
  }, []);

  // Set up device orientation listeners
  useEffect(() => {
    let timeoutId: any = null;

    const handleOrientationAbsolute = (e: DeviceOrientationEvent) => {
      isUsingAbsoluteRef.current = true;
      let heading: number | null = null;

      // iOS compass heading
      if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
        const accuracy = (e as any).webkitCompassAccuracy ?? null;
        const compassHeading: number = (e as any).webkitCompassHeading;
        const heading = normalizeAngle(compassHeading + screenAngleRef.current);
        processOrientation(heading, true, accuracy);
        return;
      }

      // Android absolute orientation
      if (e.alpha !== null && typeof e.alpha === 'number') {
        const heading = computeHeadingFromEuler(
          e.alpha,
          e.beta ?? 0,
          e.gamma ?? 0,
          screenAngleRef.current
        );
        processOrientation(heading, true, null);
      }
    };

    const handleOrientationStandard = (e: DeviceOrientationEvent) => {
      // If absolute events are already firing, avoid double-updating with relative data
      if (isUsingAbsoluteRef.current && (e as any).absolute !== true) {
        return;
      }

      if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
        const accuracy = (e as any).webkitCompassAccuracy ?? null;
        const compassHeading: number = (e as any).webkitCompassHeading;
        const heading = normalizeAngle(compassHeading + screenAngleRef.current);
        processOrientation(heading, true, accuracy);
        return;
      }

      if (e.alpha !== null && typeof e.alpha === 'number') {
        const heading = computeHeadingFromEuler(
          e.alpha,
          e.beta ?? 0,
          e.gamma ?? 0,
          screenAngleRef.current
        );
        processOrientation(heading, (e as any).absolute === true, null);
      }
    };

    const startListening = () => {
      // Listen to both absolute and standard orientation events
      window.addEventListener('deviceorientationabsolute', handleOrientationAbsolute as any, true);
      window.addEventListener('deviceorientation', handleOrientationStandard, true);

      // Timeout to detect devices without magnetometer hardware (e.g. desktop browsers)
      timeoutId = setTimeout(() => {
        if (!hasReceivedDataRef.current) {
          setSensorStatus('unsupported');
        }
      }, 1500);
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      // Check for iOS 13+ permission model
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        setSensorStatus('needs_permission');
      } else {
        startListening();
      }
    } else {
      setSensorStatus('unsupported');
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('deviceorientationabsolute', handleOrientationAbsolute as any, true);
      window.removeEventListener('deviceorientation', handleOrientationStandard, true);
    };
  }, [processOrientation]);

  // Request iOS permission on user interaction
  const requestIosPermission = async () => {
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setSensorStatus('checking');
          const handleOrientation = (e: DeviceOrientationEvent) => {
            if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
              const accuracy = (e as any).webkitCompassAccuracy ?? null;
              let heading = (e as any).webkitCompassHeading;
              heading = normalizeAngle(heading + screenAngleRef.current);
              processOrientation(heading, true, accuracy);
            }
          };
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setSensorStatus('denied');
        }
      }
    } catch (err) {
      console.warn('Device orientation permission rejected:', err);
      setSensorStatus('denied');
    }
  };

  // Cardinal direction for current phone heading
  const currentCardinal = getCardinalDirection(effectiveHeading, 8);
  const qiblaCardinal = getCardinalDirection(qiblaAngle, 8);

  // Turn instruction
  const turnDegrees = Math.round(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
  const turnDirection = relativeAngle > 180 ? 'left' : 'right';

  return (
    <div className="p-4 sm:p-5 flex flex-col items-center justify-between min-h-[calc(100vh-80px)] text-center animate-fade-in select-none">
      {/* Top Heading & Location Banner */}
      <div className="w-full text-left pt-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#14211F]">Qibla</h1>
          {/* Live GPS Status Pill */}
          <button
            onClick={refreshGps}
            disabled={isGettingGps}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-[#E3F1ED] text-[#0F5C4D] text-[11px] font-semibold hover:bg-[#d6eae4] transition-colors cursor-pointer"
            title="Refresh GPS location"
          >
            <Navigation className={`w-3 h-3 ${isGettingGps ? 'animate-spin' : ''}`} />
            <span>
              {gpsCoords
                ? `GPS ±${gpsCoords.accuracy ?? 10}m`
                : location.name}
            </span>
            <RefreshCw className={`w-2.5 h-2.5 opacity-60 ${isGettingGps ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-sm text-[#5E6E6A] mt-1">
          Hold your phone flat and turn until the arrow points straight up.
        </p>
        {gpsError && (
          <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>{gpsError}</span>
          </p>
        )}
      </div>

      {/* Main Compass Dial Container */}
      <div className="relative my-4 flex flex-col items-center justify-center">
        {/* iOS permission prompt button */}
        {sensorStatus === 'needs_permission' && (
          <div className="mb-3">
            <button
              onClick={requestIosPermission}
              className="py-2.5 px-5 rounded-2xl bg-[#0F5C4D] text-white text-xs font-bold shadow-md hover:bg-[#0c4a3e] active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Enable iPhone Compass</span>
            </button>
          </div>
        )}

        {/* Outer Circular Dial Housing */}
        <div
          className={`w-76 h-76 sm:w-84 sm:h-84 rounded-full bg-white border-2 relative flex items-center justify-center shadow-lg transition-colors duration-300 ${
            isAligned
              ? 'border-[#0F5C4D] ring-8 ring-[#0F5C4D]/15'
              : 'border-[#E4E8E5]'
          }`}
        >
          {/* Top Lubber Line (Phone Top Heading Notch) */}
          <div className="absolute top-1 flex flex-col items-center z-30 pointer-events-none">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs transition-colors ${
              isAligned ? 'bg-[#0F5C4D]' : 'bg-[#14211F]'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <div className={`w-0.5 h-2 ${isAligned ? 'bg-[#0F5C4D]' : 'bg-[#14211F]'}`} />
          </div>

          {/* Rotating Compass Dial Face (behaves like a real mobile phone compass) */}
          {/* The dial rotates opposite to device heading (-effectiveContinuousHeading) */}
          <div
            className="w-68 h-68 sm:w-76 sm:h-76 rounded-full relative flex items-center justify-center"
            style={{
              transform: `rotate(${-effectiveContinuousHeading}deg)`,
              transition: sensorStatus === 'active' ? 'transform 0.08s linear' : 'transform 0.2s ease-out',
              willChange: 'transform',
            }}
          >
            {/* SVG Compass Rose with Cardinal directions, ticks, and Kaaba marker */}
            <svg
              viewBox="0 0 280 280"
              className="w-full h-full absolute inset-0 pointer-events-none"
            >
              {/* Outer dial ring */}
              <circle
                cx="140"
                cy="140"
                r="134"
                fill="#F7FAF9"
                stroke="#E4E8E5"
                strokeWidth="1.5"
              />

              {/* Inner ring */}
              <circle
                cx="140"
                cy="140"
                r="104"
                fill="#E8F4F0"
                stroke="#D1E6DF"
                strokeWidth="1"
              />

              {/* Compass degree ticks every 15 degrees */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = i * 15;
                const isMajor = angle % 45 === 0;
                const isCardinal = angle % 90 === 0;
                const len = isCardinal ? 10 : isMajor ? 7 : 4;
                const rad = ((angle - 90) * Math.PI) / 180;
                const rOuter = 132;
                const rInner = rOuter - len;
                const x1 = 140 + rOuter * Math.cos(rad);
                const y1 = 140 + rOuter * Math.sin(rad);
                const x2 = 140 + rInner * Math.cos(rad);
                const y2 = 140 + rInner * Math.sin(rad);

                return (
                  <line
                    key={`tick-${angle}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isCardinal ? '#14211F' : isMajor ? '#5E6E6A' : '#A4B3AF'}
                    strokeWidth={isCardinal ? 2 : isMajor ? 1.5 : 1}
                  />
                );
              })}

              {/* Cardinal direction labels: N, NE, E, SE, S, SW, W, NW */}
              {[
                { label: 'N', angle: 0, bold: true, color: '#0F5C4D', size: 14 },
                { label: 'NE', angle: 45, bold: false, color: '#5E6E6A', size: 9 },
                { label: 'E', angle: 90, bold: true, color: '#14211F', size: 12 },
                { label: 'SE', angle: 135, bold: false, color: '#5E6E6A', size: 9 },
                { label: 'S', angle: 180, bold: true, color: '#14211F', size: 12 },
                { label: 'SW', angle: 225, bold: false, color: '#5E6E6A', size: 9 },
                { label: 'W', angle: 270, bold: true, color: '#14211F', size: 12 },
                { label: 'NW', angle: 315, bold: false, color: '#5E6E6A', size: 9 },
              ].map(({ label, angle, bold, color, size }) => {
                const rad = ((angle - 90) * Math.PI) / 180;
                const r = 118;
                const x = 140 + r * Math.cos(rad);
                const y = 140 + r * Math.sin(rad);

                return (
                  <text
                    key={`cardinal-${label}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={color}
                    fontSize={size}
                    fontWeight={bold ? '800' : '600'}
                    transform={`rotate(${angle}, ${x}, ${y})`}
                  >
                    {label}
                  </text>
                );
              })}

              {/* Geographically fixed Qibla Marker on the compass dial face */}
              {/* Positioned at exact bearing to Mecca from True North */}
              {(() => {
                const rad = ((qiblaAngle - 90) * Math.PI) / 180;
                const r = 104;
                const kx = 140 + r * Math.cos(rad);
                const ky = 140 + r * Math.sin(rad);

                return (
                  <g transform={`rotate(${qiblaAngle}, 140, 140)`}>
                    {/* Golden alignment line from center to Qibla marker */}
                    <line
                      x1="140"
                      y1="140"
                      x2="140"
                      y2="36"
                      stroke="#C9A24B"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.8"
                    />

                    {/* Kaaba Marker Badge */}
                    <g transform="translate(140, 36)">
                      {/* Golden beacon glow */}
                      <circle
                        cx="0"
                        cy="0"
                        r="12"
                        fill="#C9A24B"
                        fillOpacity="0.25"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="8"
                        fill="#C9A24B"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      {/* Stylized Kaaba cube in center of marker */}
                      <rect
                        x="-3"
                        y="-3"
                        width="6"
                        height="6"
                        rx="1"
                        fill="#14211F"
                      />
                      <line
                        x1="-3"
                        y1="-1"
                        x2="3"
                        y2="-1"
                        stroke="#C9A24B"
                        strokeWidth="0.8"
                      />
                    </g>
                  </g>
                );
              })()}
            </svg>

            {/* Central Emerald Qibla Arrow Pointer */}
            {/* Points along the relative Qibla bearing */}
            <div
              className="absolute w-20 h-44 flex flex-col items-center justify-start pointer-events-none"
              style={{
                transform: `rotate(${qiblaAngle}deg)`,
                transformOrigin: '50% 100%',
                top: 'calc(50% - 176px)',
              }}
            >
              {/* Emerald Needle Head */}
              <div
                className={`w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[50px] filter drop-shadow-md transition-colors ${
                  isAligned ? 'border-b-[#0F5C4D]' : 'border-b-[#0F5C4D]'
                }`}
              />
              <div className="w-1.5 h-16 bg-[#0F5C4D]/80 rounded-full mt-[-2px]" />
            </div>

            {/* Center Gold Hub */}
            <div className="w-7 h-7 rounded-full bg-white border-2 border-[#E4E8E5] shadow-xs flex items-center justify-center z-10">
              <div className="w-3.5 h-3.5 rounded-full bg-[#C9A24B] border border-white shadow-2xs" />
            </div>
          </div>
        </div>

        {/* Current Device Compass Heading Readout */}
        <div className="mt-3 text-xs font-semibold text-[#5E6E6A] flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#0F5C4D]" />
          <span>
            Heading: <strong className="text-[#14211F]">{Math.round(effectiveHeading)}° {currentCardinal}</strong>
          </span>
          {isAbsoluteSensor && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              True North
            </span>
          )}
        </div>

        {/* Fallback Simulator / Calibrator Slider when sensor is inactive or on desktop */}
        {sensorStatus !== 'active' && (
          <div className="w-72 mt-3 px-3 py-2.5 rounded-2xl bg-white border border-[#E4E8E5] shadow-2xs text-left">
            <div className="flex items-center justify-between text-[11px] text-[#5E6E6A] mb-1.5">
              <span>Simulate phone rotation:</span>
              <span className="font-bold text-[#14211F]">{manualHeading}° ({getCardinalDirection(manualHeading)})</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={manualHeading}
              onChange={(e) => setManualHeading(Number(e.target.value))}
              className="w-full accent-[#0F5C4D] cursor-pointer"
            />
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <button
                onClick={() => setManualHeading(0)}
                className="text-[#5E6E6A] hover:text-[#14211F]"
              >
                Face North (0°)
              </button>
              <button
                onClick={() => setManualHeading(Math.round(qiblaAngle))}
                className="text-[#0F5C4D] font-bold hover:underline"
              >
                Face Makkah ({Math.round(qiblaAngle)}°)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Degree & Distance Readout */}
      <div className="space-y-1.5 my-1">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl font-extrabold text-[#14211F] tracking-tight">
            {Math.round(qiblaAngle)}°
          </span>
          <span className="text-base font-bold text-[#0F5C4D]">
            {qiblaCardinal}
          </span>
        </div>
        <div className="text-sm text-[#5E6E6A]">
          Makkah is about {distanceKm.toLocaleString()} km away from {location.name}
        </div>

        {/* Facing Status Badge */}
        <div className="pt-2">
          {isAligned ? (
            <div className="inline-flex items-center gap-2 py-2 px-6 rounded-full bg-[#0F5C4D] text-white text-sm font-bold shadow-md animate-bounce-short">
              <Check className="w-4.5 h-4.5 text-white stroke-[3]" />
              <span>You're facing Makkah ({Math.round(relativeAngle)}°)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-[#E3F1ED] text-[#0F5C4D] text-xs font-semibold">
              <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>
                Turn {turnDegrees}° {turnDirection}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting & Figure-8 Calibration Guide */}
      <div className="w-full mt-3 p-3.5 rounded-2xl bg-white border border-[#E4E8E5] text-left shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E3F1ED] flex items-center justify-center shrink-0 text-[#0F5C4D]">
              <Compass className="w-4.5 h-4.5 text-[#0F5C4D]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#14211F]">
                Compass Calibration
              </p>
              <p className="text-[11px] text-[#5E6E6A]">
                Move your phone in a figure-8 motion to calibrate the compass.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCalibrationGuide(!showCalibrationGuide)}
            className="text-[11px] font-semibold text-[#0F5C4D] hover:underline cursor-pointer shrink-0 ml-2"
          >
            {showCalibrationGuide ? 'Hide' : 'How?'}
          </button>
        </div>

        {/* Expandable calibration guide */}
        {showCalibrationGuide && (
          <div className="mt-2.5 pt-2.5 border-t border-[#E4E8E5] text-[11px] text-[#5E6E6A] space-y-1">
            <p className="font-medium text-[#14211F]">To calibrate phone magnetometer:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Step away from large metal objects, speakers, or laptops.</li>
              <li>Hold your phone firmly in hand and wave it in a gentle figure-8 motion twice.</li>
              <li>Keep the phone as flat as possible for maximum accuracy.</li>
            </ol>
            {sensorAccuracy !== null && (
              <p className="text-[10px] text-[#0F5C4D] pt-1">
                Sensor accuracy rating: ±{sensorAccuracy}°
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
