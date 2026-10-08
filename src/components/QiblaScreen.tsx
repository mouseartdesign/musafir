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

  // Heading from device orientation or self-rotating to North
  const effectiveHeading = deviceHeading;
  const effectiveContinuousHeading = continuousHeading;

  // Relative Qibla angle: degrees clockwise from phone top to Kaaba
  // When effectiveHeading === qiblaAngle, relativeAngle is 0 (straight UP)
  const relativeAngle = normalizeAngle(qiblaAngle - effectiveHeading);

  // Aligned within ±4 degrees
  const isAligned = Math.abs(relativeAngle) <= 4 || Math.abs(relativeAngle - 360) <= 4;

  // Auto-rotate smoothly on its own to the North on mount if no live sensor has taken over
  useEffect(() => {
    let animationFrameId: number;
    const startTime = performance.now();
    const startAngle = 55; // Initial natural visual offset
    const duration = 1200; // ms

    const animateToNorth = (currentTime: number) => {
      // If live sensor events have taken over, immediately cancel auto-rotation
      if (hasReceivedDataRef.current) {
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Natural dampened harmonic settling curve like a real liquid-filled compass needle
      const damp = Math.exp(-3.5 * progress);
      const osc = Math.cos(progress * Math.PI * 2.5);
      const angle = startAngle * damp * osc;

      setDeviceHeading(normalizeAngle(angle));
      setContinuousHeading(angle);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateToNorth);
      } else {
        setDeviceHeading(0);
        setContinuousHeading(0);
      }
    };

    animationFrameId = requestAnimationFrame(animateToNorth);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

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
    const handleOrientationAbsolute = (e: DeviceOrientationEvent) => {
      isUsingAbsoluteRef.current = true;

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
      // Listen continuously to both absolute and standard orientation events
      window.addEventListener('deviceorientationabsolute', handleOrientationAbsolute as any, true);
      window.addEventListener('deviceorientation', handleOrientationStandard, true);
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      // Check for iOS 13+ permission model
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        setSensorStatus('needs_permission');
      } else {
        startListening();
      }
    }

    return () => {
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
              const compassHeading: number = (e as any).webkitCompassHeading;
              const heading = normalizeAngle(compassHeading + screenAngleRef.current);
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
    <div className="w-full max-w-md mx-auto px-4 py-2 sm:px-5 sm:py-3 flex flex-col items-center justify-between min-h-[calc(100dvh-76px)] text-center animate-fade-in select-none overflow-x-hidden">
      {/* Top Heading & Location Banner */}
      <div className="w-full text-left pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#14211F]">Qibla</h1>
          {/* Live GPS Status Pill */}
          <button
            onClick={refreshGps}
            disabled={isGettingGps}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-[#E3F1ED] text-[#0F5C4D] text-[11px] font-semibold hover:bg-[#d6eae4] transition-colors cursor-pointer shrink-0"
            title="Refresh GPS location"
          >
            <Navigation className={`w-3 h-3 ${isGettingGps ? 'animate-spin' : ''}`} />
            <span className="truncate max-w-[130px] sm:max-w-[200px]">
              {gpsCoords
                ? `GPS ±${gpsCoords.accuracy ?? 10}m`
                : location.name}
            </span>
            <RefreshCw className={`w-2.5 h-2.5 opacity-60 ${isGettingGps ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs sm:text-sm text-[#5E6E6A] mt-0.5">
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
      <div className="relative my-2 sm:my-3 flex flex-col items-center justify-center shrink-0">
        {/* iOS permission prompt button if required */}
        {sensorStatus === 'needs_permission' && (
          <div className="mb-2">
            <button
              onClick={requestIosPermission}
              className="py-2 px-4 rounded-2xl bg-[#0F5C4D] text-white text-xs font-bold shadow-md hover:bg-[#0c4a3e] active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Enable iPhone Compass</span>
            </button>
          </div>
        )}

        {/* Outer Circular Dial Housing */}
        <div
          className={`w-[min(62vw,240px)] h-[min(62vw,240px)] aspect-square rounded-full bg-white border-2 relative flex items-center justify-center shadow-lg transition-colors duration-300 ${
            isAligned
              ? 'border-[#0F5C4D] ring-6 sm:ring-8 ring-[#0F5C4D]/15'
              : 'border-[#E4E8E5]'
          }`}
        >
          {/* Top Lubber Line (Phone Top Heading Notch) */}
          <div className="absolute top-1 flex flex-col items-center z-30 pointer-events-none">
            <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex items-center justify-center shadow-xs transition-colors ${
              isAligned ? 'bg-[#0F5C4D]' : 'bg-[#14211F]'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <div className={`w-0.5 h-1.5 sm:h-2 ${isAligned ? 'bg-[#0F5C4D]' : 'bg-[#14211F]'}`} />
          </div>

          {/* Rotating Compass Dial Face (rotates on its own to North) */}
          {/* The dial rotates opposite to heading (-effectiveContinuousHeading) so North points to True North */}
          <div
            className="w-[90%] h-[90%] aspect-square rounded-full relative flex items-center justify-center"
            style={{
              transform: `rotate(${-effectiveContinuousHeading}deg)`,
              transition: sensorStatus === 'active' ? 'transform 0.08s linear' : 'transform 0.15s ease-out',
              willChange: 'transform',
            }}
          >
            {/* SVG Compass Rose with Cardinal directions, ticks, Kaaba marker, and Emerald needle */}
            <svg
              viewBox="0 0 280 280"
              className="w-full h-full pointer-events-none overflow-visible"
            >
              <defs>
                <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F5C4D" floodOpacity="0.3" />
                </filter>
              </defs>

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

              {/* Distinct North Needle Arrow pointing to N (0°) on the compass dial */}
              <g transform="rotate(0, 140, 140)">
                <polygon
                  points="140,40 144,70 136,70"
                  fill="#0F5C4D"
                  opacity="0.8"
                />
              </g>

              {/* Geographically fixed Qibla Marker & Emerald Arrow on the compass dial face */}
              {/* Positioned at exact bearing to Mecca from True North */}
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

                {/* Kaaba Marker Beacon */}
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

                {/* Central Emerald Needle pointing along Qibla bearing */}
                <g filter="url(#emerald-glow)">
                  {/* Needle head pointing towards Kaaba */}
                  <polygon
                    points="140,48 149,94 140,88 131,94"
                    fill="#0F5C4D"
                  />
                  {/* Needle shaft down to center */}
                  <line
                    x1="140"
                    y1="88"
                    x2="140"
                    y2="140"
                    stroke="#0F5C4D"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </g>
              </g>

              {/* Center Gold Hub */}
              <circle
                cx="140"
                cy="140"
                r="13"
                fill="#FFFFFF"
                stroke="#E4E8E5"
                strokeWidth="2"
              />
              <circle
                cx="140"
                cy="140"
                r="6.5"
                fill="#C9A24B"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        {/* Current Device Compass Heading Readout */}
        <div className="mt-2 sm:mt-2.5 text-[11px] sm:text-xs font-semibold text-[#5E6E6A] flex items-center gap-1.5">
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
      </div>

      {/* Degree & Distance Readout */}
      <div className="space-y-1 my-1 shrink-0">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-[#14211F] tracking-tight">
            {Math.round(qiblaAngle)}°
          </span>
          <span className="text-sm sm:text-base font-bold text-[#0F5C4D]">
            {qiblaCardinal}
          </span>
        </div>
        <div className="text-xs sm:text-sm text-[#5E6E6A]">
          Makkah is about {distanceKm.toLocaleString()} km away from {location.name}
        </div>

        {/* Facing Status Badge */}
        <div className="pt-1.5">
          {isAligned ? (
            <div className="inline-flex items-center gap-1.5 py-1.5 px-5 rounded-full bg-[#0F5C4D] text-white text-xs sm:text-sm font-bold shadow-md animate-bounce-short">
              <Check className="w-4 h-4 text-white stroke-[3]" />
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
      <div className="w-full max-w-sm mt-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-[#E4E8E5] text-left shadow-2xs shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#E3F1ED] flex items-center justify-center shrink-0 text-[#0F5C4D]">
              <Compass className="w-4 h-4 text-[#0F5C4D]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#14211F]">
                Compass Calibration
              </p>
              <p className="text-[10px] sm:text-[11px] text-[#5E6E6A]">
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
          <div className="mt-2 pt-2 border-t border-[#E4E8E5] text-[10px] sm:text-[11px] text-[#5E6E6A] space-y-1">
            <p className="font-medium text-[#14211F]">To calibrate phone magnetometer:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Step away from large metal objects, speakers, or laptops.</li>
              <li>Hold your phone firmly in hand and wave it in a gentle figure-8 motion twice.</li>
              <li>Keep the phone as flat as possible for maximum accuracy.</li>
            </ol>
            {sensorAccuracy !== null && (
              <p className="text-[10px] text-[#0F5C4D] pt-0.5">
                Sensor accuracy rating: ±{sensorAccuracy}°
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
