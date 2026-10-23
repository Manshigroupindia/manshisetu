// Custom Hook for Robust Geolocation & Duty Attendance Actions in Manshi Group Setu

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  acquireRobustGPSCoordinates,
  GeoErrorDetails,
  GPSCoordinates,
} from '../utils/geoUtils';
import { useApp } from '../context/AppContext';

export interface UseAttendanceLocationReturn {
  isLocating: boolean;
  locatingMessage: string;
  geoError: GeoErrorDetails | null;
  lastAction: 'duty_on' | 'duty_off' | null;
  executeDutyAction: (actionType: 'duty_on' | 'duty_off') => Promise<boolean>;
  retryLocation: () => Promise<boolean>;
  clearGeoError: () => void;
}

export function useAttendanceLocation(): UseAttendanceLocationReturn {
  const { currentStaff, recordDutyOn, recordDutyOff, showToast } = useApp();

  const [isLocating, setIsLocating] = useState(false);
  const [locatingMessage, setLocatingMessage] = useState('');
  const [geoError, setGeoError] = useState<GeoErrorDetails | null>(null);
  const [lastAction, setLastAction] = useState<'duty_on' | 'duty_off' | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isExecutingRef = useRef(false);

  // Clean up any pending location request when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isExecutingRef.current = false;
    };
  }, []);

  const clearGeoError = useCallback(() => {
    setGeoError(null);
  }, []);

  const executeDutyAction = useCallback(
    async (actionType: 'duty_on' | 'duty_off'): Promise<boolean> => {
      if (!currentStaff) {
        showToast('Staff profile not found. Please log in again.', 'error');
        return false;
      }

      // Prevent duplicate requests while an active request is in-flight
      if (isExecutingRef.current) {
        showToast('GPS location acquisition already in progress. Please wait...', 'info');
        return false;
      }

      // Cancel any previous stalled request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      isExecutingRef.current = true;

      setIsLocating(true);
      setLocatingMessage('Acquiring high-accuracy GPS fix...');
      setGeoError(null);
      setLastAction(actionType);

      try {
        const coords: GPSCoordinates = await acquireRobustGPSCoordinates({
          onProgress: (msg) => {
            if (!controller.signal.aborted) {
              setLocatingMessage(msg);
            }
          },
          signal: controller.signal,
        });

        // Ensure not aborted before updating database
        if (controller.signal.aborted) {
          return false;
        }

        // Apply existing location validation and record duty
        if (actionType === 'duty_on') {
          recordDutyOn(currentStaff.id, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
          });
        } else {
          recordDutyOff(currentStaff.id, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
          });
        }

        setGeoError(null);
        return true;
      } catch (err: any) {
        if (controller.signal.aborted) {
          return false;
        }

        const details: GeoErrorDetails = err?.kind
          ? (err as GeoErrorDetails)
          : {
              kind: 'UNKNOWN',
              title: 'Location Acquisition Failed',
              message: err?.message || 'Failed to capture GPS location.',
              guidance: 'Please click "Retry Location" to capture coordinates again.',
              canRetry: true,
            };

        setGeoError(details);
        showToast(`${details.title}: ${details.message}`, 'error');
        return false;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        isExecutingRef.current = false;
        setIsLocating(false);
        setLocatingMessage('');
      }
    },
    [currentStaff, recordDutyOn, recordDutyOff, showToast]
  );

  const retryLocation = useCallback(async (): Promise<boolean> => {
    return executeDutyAction(lastAction || 'duty_on');
  }, [executeDutyAction, lastAction]);

  return {
    isLocating,
    locatingMessage,
    geoError,
    lastAction,
    executeDutyAction,
    retryLocation,
    clearGeoError,
  };
}
