// Custom Hook for Robust Geolocation & Duty Attendance Actions in Manshi Group Setu

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  acquireRobustGPSCoordinates,
  GeoErrorDetails,
  GPSCoordinates,
} from '../utils/geoUtils';
import { getCanonicalEmployeeId } from '../utils/firestoreUtils';
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
  const { currentStaff, recordDutyOn, recordDutyOff, showToast, auth } = useApp();

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
      if (!currentStaff && !auth.isAuthenticated) {
        showToast('Staff profile not found. Please log in again.', 'error');
        return false;
      }

      // Prevent duplicate requests while an active request is in-flight
      if (isExecutingRef.current) {
        showToast('Attendance operation already in progress. Please wait...', 'info');
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
      setLocatingMessage('Getting your location (High Accuracy GPS)...');
      setGeoError(null);
      setLastAction(actionType);

      // ==========================================
      // STAGE 1: GPS Location Capture
      // ==========================================
      let coords: GPSCoordinates;
      try {
        coords = await acquireRobustGPSCoordinates({
          onProgress: (msg) => {
            if (!controller.signal.aborted) {
              setLocatingMessage(msg);
            }
          },
          signal: controller.signal,
        });
      } catch (geoErr: any) {
        if (controller.signal.aborted) {
          return false;
        }

        const details: GeoErrorDetails = geoErr?.kind
          ? (geoErr as GeoErrorDetails)
          : {
              kind: 'UNKNOWN',
              title: 'Location Acquisition Failed',
              message: geoErr?.message || 'Failed to capture device GPS location.',
              guidance: 'Please check device location settings, ensure Wi-Fi is enabled, and click "Retry Location".',
              canRetry: true,
              technicalMessage: geoErr?.message,
            };

        setGeoError(details);
        showToast(`${details.title}: ${details.message}`, 'error');
        return false;
      } finally {
        if (controller.signal.aborted) {
          isExecutingRef.current = false;
          setIsLocating(false);
          setLocatingMessage('');
        }
      }

      if (controller.signal.aborted) {
        return false;
      }

      // ==========================================
      // STAGE 2: Firestore Attendance Write
      // GPS Succeeded! Any failure here is a Database / Security issue.
      // ==========================================
      setLocatingMessage('Saving attendance to cloud database...');

      const canonicalStaffId = getCanonicalEmployeeId(
        currentStaff?.employeeId,
        auth.employeeId || currentStaff?.id
      );

      if (!canonicalStaffId) {
        const details: GeoErrorDetails = {
          kind: 'UNKNOWN',
          title: 'Staff Identity Unresolved',
          message: 'Unable to resolve your canonical Employee ID for attendance.',
          guidance: 'Please log out and sign back in to refresh your employee credentials.',
          canRetry: false,
        };
        setGeoError(details);
        showToast('Staff profile missing canonical Employee ID. Please log in again.', 'error');
        isExecutingRef.current = false;
        setIsLocating(false);
        setLocatingMessage('');
        return false;
      }

      try {
        if (actionType === 'duty_on') {
          await recordDutyOn(canonicalStaffId, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
          });
        } else {
          await recordDutyOff(canonicalStaffId, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
          });
        }

        setGeoError(null);
        return true;
      } catch (dbErr: any) {
        if (controller.signal.aborted) {
          return false;
        }

        const rawCode = (dbErr?.code || '').toString();
        const rawMsg = (dbErr?.message || '').toString();
        const isPermission =
          rawCode === 'permission-denied' ||
          rawCode.includes('permission') ||
          rawMsg.toLowerCase().includes('permission') ||
          rawMsg.toLowerCase().includes('insufficient permissions');

        const details: GeoErrorDetails = {
          kind: isPermission ? 'PERMISSION_DENIED' : 'UNKNOWN',
          title: 'Attendance could not be saved',
          message: isPermission
            ? `Firebase permission denied [${rawCode || 'permission-denied'}]: ${rawMsg || 'Missing or insufficient permissions.'}`
            : `Database error [${rawCode || 'firestore/error'}]: ${rawMsg || 'Failed to save attendance record to Firestore.'}`,
          guidance: isPermission
            ? `Your GPS position was captured successfully (±${Math.round(coords.accuracy)}m), but Firestore rejected the database write. This is a database permission issue, not a GPS issue. Please ensure your employee account (${canonicalStaffId}) is registered in Firestore users with matching employeeId, or contact Administration.`
            : `Your GPS position was captured successfully (±${Math.round(coords.accuracy)}m), but persisting to Firestore failed. Please check your internet connection and try saving again.`,
          canRetry: !isPermission,
          technicalMessage: `Firestore write error: [${rawCode}]: ${rawMsg}`,
        };

        setGeoError(details);
        showToast(`Attendance could not be saved: ${rawMsg || rawCode}`, 'error');
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
    [currentStaff, auth, recordDutyOn, recordDutyOff, showToast]
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
