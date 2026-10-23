// Geolocation & Distance Utilities for Manshi Group Setu

/**
 * Calculate straight-line distance in meters between two GPS coordinates using the Haversine formula
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's mean radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // meters
}

/**
 * Format meters to human readable distance
 */
export function formatDistance(meters?: number): string {
  if (meters === undefined || meters === null || isNaN(meters)) {
    return 'Distance unavailable';
  }
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Generates Google Maps URL for coordinates
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * Format date in Indian Standard Time (Asia/Kolkata)
 */
export function getISTTimestamp(date: Date = new Date()): {
  displayTime: string;
  timeOnly: string;
  isoString: string;
} {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };
  
  const timeOnly = date.toLocaleTimeString('en-IN', options);
  const displayTime = `${timeOnly} (IST)`;
  const isoString = date.toISOString();

  return { displayTime, timeOnly, isoString };
}

/**
 * Compute duration between two ISO timestamps
 */
export function computeSessionDuration(startIso?: string, endIso?: string): {
  hours: number;
  durationText: string;
} {
  if (!startIso) return { hours: 0, durationText: '0 hrs' };
  
  const startTime = new Date(startIso).getTime();
  const endTime = endIso ? new Date(endIso).getTime() : Date.now();
  
  if (isNaN(startTime) || isNaN(endTime) || endTime < startTime) {
    return { hours: 0, durationText: '0 hrs' };
  }
  
  const diffMinutes = Math.floor((endTime - startTime) / (1000 * 60));
  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  
  const hoursDecimal = Math.round((diffMinutes / 60) * 10) / 10;
  const durationText = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;
  
  return { hours: hoursDecimal, durationText };
}

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  isFallback?: boolean;
}

export type GeoErrorKind =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INSECURE_CONTEXT'
  | 'NOT_SUPPORTED'
  | 'ALREADY_IN_PROGRESS'
  | 'UNKNOWN';

export interface GeoErrorDetails {
  kind: GeoErrorKind;
  title: string;
  message: string;
  guidance: string;
  canRetry: boolean;
  technicalMessage?: string;
}

export interface AcquireLocationOptions {
  onProgress?: (message: string) => void;
  signal?: AbortSignal;
}

/**
 * Acquire GPS Coordinates with High Accuracy, 25s timeout, and automatic Network / Wi-Fi fallback.
 * Never invents mock or dummy coordinates.
 */
export async function acquireRobustGPSCoordinates(
  options?: AcquireLocationOptions
): Promise<GPSCoordinates> {
  const { onProgress, signal } = options || {};

  // 1. Secure Context Check (HTTPS / Localhost)
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]'
    );
    if (!isLocalhost) {
      const err: GeoErrorDetails = {
        kind: 'INSECURE_CONTEXT',
        title: 'HTTPS Connection Required',
        message: 'Browser security policies strictly block Geolocation on unencrypted HTTP connections.',
        guidance: 'Please access the portal over HTTPS (or on localhost) to allow sensor and location access.',
        canRetry: false,
      };
      throw err;
    }
  }

  // 2. Geolocation Support Check
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    const err: GeoErrorDetails = {
      kind: 'NOT_SUPPORTED',
      title: 'Geolocation Not Supported',
      message: 'This browser or operating system environment does not support the Geolocation API.',
      guidance: 'Please access the terminal using a modern browser such as Google Chrome, Edge, Safari, or Firefox.',
      canRetry: false,
    };
    throw err;
  }

  // Helper to wrap getCurrentPosition into a clean Promise with timeout & abort handling
  const getPositionPromise = (posOptions: PositionOptions, label: string): Promise<GeolocationPosition> => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new DOMException('Location request was cancelled.', 'AbortError'));
      }

      let completed = false;

      const successHandler = (position: GeolocationPosition) => {
        if (completed) return;
        completed = true;
        resolve(position);
      };

      const errorHandler = (error: GeolocationPositionError) => {
        if (completed) return;
        completed = true;
        reject(error);
      };

      // Watch for abort signal
      const onAbort = () => {
        if (completed) return;
        completed = true;
        reject(new DOMException('Location request was cancelled.', 'AbortError'));
      };

      signal?.addEventListener('abort', onAbort, { once: true });

      navigator.geolocation.getCurrentPosition(successHandler, errorHandler, posOptions);
    });
  };

  // 3. Primary Attempt: High Accuracy (GPS Satellites, 25s timeout, 15s maximumAge)
  onProgress?.('Contacting GPS satellites (High Accuracy mode)...');

  try {
    const highAccuracyOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 25000, // 25 seconds (within 20–30s range)
      maximumAge: 15000, // 15 seconds (allows fresh cache, prevents slow cold GPS locks)
    };

    const position = await getPositionPromise(highAccuracyOptions, 'high_accuracy');

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
      isFallback: false,
    };
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      throw {
        kind: 'UNKNOWN',
        title: 'Request Cancelled',
        message: 'Location acquisition was cancelled.',
        guidance: 'Click Retry Location to request GPS coordinates again.',
        canRetry: true,
      } as GeoErrorDetails;
    }

    // GeolocationPositionError codes:
    // 1: PERMISSION_DENIED
    // 2: POSITION_UNAVAILABLE
    // 3: TIMEOUT
    const code = err?.code;

    // If permission was explicitly denied by user, do NOT attempt fallback
    if (code === 1) {
      throw {
        kind: 'PERMISSION_DENIED',
        title: 'Location Permission Denied',
        message: 'Location access was blocked by your browser or operating system settings.',
        guidance:
          'Click the padlock or tune icon in your browser address bar, set Location permission to "Allow", and click "Retry Location".',
        canRetry: true,
        technicalMessage: err.message,
      } as GeoErrorDetails;
    }

    // If High Accuracy timed out (code 3) or position unavailable (code 2), attempt low-accuracy fallback
    onProgress?.('GPS satellites timed out. Retrying with Network / Wi-Fi positioning fallback...');

    try {
      const fallbackOptions: PositionOptions = {
        enableHighAccuracy: false, // Network / Wi-Fi / Cell triangulation
        timeout: 20000, // 20 seconds
        maximumAge: 30000, // 30 seconds
      };

      const fallbackPosition = await getPositionPromise(fallbackOptions, 'network_fallback');

      return {
        latitude: fallbackPosition.coords.latitude,
        longitude: fallbackPosition.coords.longitude,
        accuracy: fallbackPosition.coords.accuracy,
        altitude: fallbackPosition.coords.altitude,
        heading: fallbackPosition.coords.heading,
        speed: fallbackPosition.coords.speed,
        timestamp: fallbackPosition.timestamp,
        isFallback: true,
      };
    } catch (fallbackErr: any) {
      if (signal?.aborted || fallbackErr?.name === 'AbortError') {
        throw {
          kind: 'UNKNOWN',
          title: 'Request Cancelled',
          message: 'Location acquisition was cancelled.',
          guidance: 'Click Retry Location to request GPS coordinates again.',
          canRetry: true,
        } as GeoErrorDetails;
      }

      const fbCode = fallbackErr?.code || code;

      if (fbCode === 1) {
        throw {
          kind: 'PERMISSION_DENIED',
          title: 'Location Permission Denied',
          message: 'Location access was blocked by your browser or operating system settings.',
          guidance:
            'Click the padlock or tune icon in your browser address bar, set Location permission to "Allow", and click "Retry Location".',
          canRetry: true,
          technicalMessage: fallbackErr.message,
        } as GeoErrorDetails;
      }

      if (fbCode === 3) {
        throw {
          kind: 'TIMEOUT',
          title: 'Location Request Timed Out',
          message: 'Both high-accuracy satellite GPS and network positioning requests timed out.',
          guidance:
            'Ensure you have an active network connection or move closer to an open window, then click "Retry Location".',
          canRetry: true,
          technicalMessage: fallbackErr.message,
        } as GeoErrorDetails;
      }

      if (fbCode === 2) {
        throw {
          kind: 'POSITION_UNAVAILABLE',
          title: 'Device Location Unavailable',
          message: 'Unable to retrieve your device coordinates. GPS/Location services may be turned off.',
          guidance:
            'Please verify that device Location / GPS service is switched ON in Windows or mobile device settings, then click "Retry Location".',
          canRetry: true,
          technicalMessage: fallbackErr.message,
        } as GeoErrorDetails;
      }

      throw {
        kind: 'UNKNOWN',
        title: 'Location Acquisition Failed',
        message: fallbackErr.message || err.message || 'An unexpected error occurred while acquiring GPS coordinates.',
        guidance: 'Please click "Retry Location". If the problem persists, try restarting your browser.',
        canRetry: true,
        technicalMessage: fallbackErr.message || err.message,
      } as GeoErrorDetails;
    }
  }
}

