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
 * Generates Google Maps embed URL for interactive map preview iframe
 */
export function getGoogleMapsEmbedUrl(latitude: number, longitude: number): string {
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
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
  | 'POOR_ACCURACY'
  | 'ALREADY_IN_PROGRESS'
  | 'UNKNOWN';

export interface GeoErrorDetails {
  kind: GeoErrorKind;
  title: string;
  message: string;
  guidance: string;
  canRetry: boolean;
  technicalMessage?: string;
  accuracy?: number;
}

export interface AcquireLocationOptions {
  onProgress?: (message: string) => void;
  signal?: AbortSignal;
}

/**
 * Acquire device coordinates using a practical two-tier strategy:
 * 1. Attempt high-accuracy GPS (enableHighAccuracy: true, timeout: 10s, maximumAge: 0)
 * 2. If high-accuracy times out or fails (e.g. laptops, indoor environments lacking satellite line-of-sight),
 *    immediately fallback to standard network/Wi-Fi positioning (enableHighAccuracy: false, timeout: 12s, maximumAge: 0).
 * 3. Accept any valid position returned by the browser regardless of reported accuracy.
 * Never fabricate coordinates or substitute fixed office coordinates.
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
      guidance: 'Please access the portal using a modern browser such as Google Chrome, Edge, Safari, or Firefox.',
      canRetry: false,
    };
    throw err;
  }

  // Helper to wrap getCurrentPosition into a clean Promise with timeout & abort handling
  const getPositionPromise = (posOptions: PositionOptions): Promise<GeolocationPosition> => {
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

  let position: GeolocationPosition | null = null;
  let isFallback = false;
  let primaryError: any = null;

  // 3. Attempt 1: High Accuracy GPS (Satellite positioning, 10s timeout, maximumAge 0 for fresh coordinates)
  onProgress?.('Acquiring high-accuracy GPS position...');

  try {
    position = await getPositionPromise({
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds reasonable timeout
      maximumAge: 0,   // Fresh coordinates
    });
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      throw {
        kind: 'UNKNOWN',
        title: 'Request Cancelled',
        message: 'Location acquisition was cancelled.',
        guidance: 'Click "Retry Location" to request coordinates again.',
        canRetry: true,
      } as GeoErrorDetails;
    }

    // If permission was explicitly denied, do not waste time on Attempt 2
    if (err?.code === 1) {
      throw {
        kind: 'PERMISSION_DENIED',
        title: 'Location Permission Denied',
        message: 'Location access was blocked by your browser or operating system settings.',
        guidance:
          'Click the padlock or site settings icon in your browser address bar (top left), set Location permission to "Allow", and click "Retry Location". Also verify Windows Settings → Privacy & security → Location is turned ON.',
        canRetry: true,
        technicalMessage: err.message,
      } as GeoErrorDetails;
    }

    primaryError = err;
  }

  // 4. Attempt 2: Standard Accuracy Fallback (Wi-Fi, cellular, IP network triangulation)
  // If primary attempt timed out or failed to provide a position
  if (!position) {
    if (signal?.aborted) {
      throw {
        kind: 'UNKNOWN',
        title: 'Request Cancelled',
        message: 'Location acquisition was cancelled.',
        guidance: 'Click "Retry Location" to request coordinates again.',
        canRetry: true,
      } as GeoErrorDetails;
    }

    onProgress?.('Satellite GPS slow or unavailable. Switching to Wi-Fi / Network positioning...');

    try {
      position = await getPositionPromise({
        enableHighAccuracy: false,
        timeout: 12000, // 12 seconds reasonable timeout for network positioning
        maximumAge: 0,   // Fresh coordinates
      });
      isFallback = true;
    } catch (err: any) {
      if (signal?.aborted || err?.name === 'AbortError') {
        throw {
          kind: 'UNKNOWN',
          title: 'Request Cancelled',
          message: 'Location acquisition was cancelled.',
          guidance: 'Click "Retry Location" to request coordinates again.',
          canRetry: true,
        } as GeoErrorDetails;
      }

      const activeError = err?.code ? err : primaryError || err;
      const code = activeError?.code;

      // 1: PERMISSION_DENIED
      if (code === 1) {
        throw {
          kind: 'PERMISSION_DENIED',
          title: 'Location Permission Denied',
          message: 'Location access was blocked by your browser or operating system settings.',
          guidance:
            'Click the padlock or site settings icon in your browser address bar (top left), set Location permission to "Allow", and click "Retry Location". On Windows, open Settings → Privacy & security → Location and turn ON "Location services".',
          canRetry: true,
          technicalMessage: activeError.message,
        } as GeoErrorDetails;
      }

      // 2: POSITION_UNAVAILABLE
      if (code === 2) {
        throw {
          kind: 'POSITION_UNAVAILABLE',
          title: 'Device Location Unavailable',
          message: 'Unable to retrieve your device coordinates via GPS or network location providers.',
          guidance:
            'On Windows: Open Settings → Privacy & security → Location, turn ON "Location services" and "Let desktop apps access your location". Ensure Wi-Fi is enabled to assist positioning, then click "Retry Location". On Android/iOS: Turn ON Location in device settings.',
          canRetry: true,
          technicalMessage: activeError.message,
        } as GeoErrorDetails;
      }

      // 3: TIMEOUT
      if (code === 3) {
        throw {
          kind: 'TIMEOUT',
          title: 'Location Request Timed Out',
          message: 'Your device was unable to return a position via high-accuracy GPS or network positioning within the allowed time.',
          guidance:
            'Ensure your device is connected to the internet, enable device Wi-Fi to assist positioning, then click "Retry Location".',
          canRetry: true,
          technicalMessage: activeError.message,
        } as GeoErrorDetails;
      }

      throw {
        kind: 'UNKNOWN',
        title: 'Location Acquisition Failed',
        message: activeError.message || 'An unexpected error occurred while acquiring coordinates.',
        guidance: 'Please click "Retry Location". If the problem persists, ensure your internet connection is active.',
        canRetry: true,
        technicalMessage: activeError.message,
      } as GeoErrorDetails;
    }
  }

  // 5. Valid Position Received — Accept and save regardless of reported accuracy!
  // Never fabricate coordinates or substitute a fixed office location.
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    altitude: position.coords.altitude,
    heading: position.coords.heading,
    speed: position.coords.speed,
    timestamp: position.timestamp,
    isFallback,
  };
}

