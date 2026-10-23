// GPS Attendance Backend Service for Manshi Group Setu

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  AttendanceRecord,
  CompanySettings,
  GPSLocation,
  LocationVerificationStatus,
} from '../types';
import {
  calculateHaversineDistanceMeters,
  getGoogleMapsUrl,
  getISTTimestamp,
  computeSessionDuration,
} from '../utils/geoUtils';
import { isDemoAttendance } from '../utils/demoDataFilter';

export class AttendanceService {
  /**
   * Helper to format date string YYYY-MM-DD
   */
  getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Record Duty On (Check-in) with GPS coordinates and Geofence Verification
   */
  async recordDutyOn(
    staffId: string,
    coords: { latitude: number; longitude: number; accuracy: number },
    settings: CompanySettings
  ): Promise<AttendanceRecord> {
    const todayStr = this.getTodayDateString();
    const office = settings.officeGeofence || {
      latitude: 28.6289,
      longitude: 77.2219,
      radiusMeters: 300,
      enabled: true,
    };

    const distance = calculateHaversineDistanceMeters(
      coords.latitude,
      coords.longitude,
      office.latitude,
      office.longitude
    );

    let verification: LocationVerificationStatus = 'within_geofence';
    if (coords.accuracy > 500) {
      verification = 'needs_review';
    } else if (office.enabled && distance > office.radiusMeters) {
      verification = 'outside_geofence';
    } else {
      verification = 'within_geofence';
    }

    const { displayTime, timeOnly, isoString } = getISTTimestamp(new Date());
    const mapsUrl = getGoogleMapsUrl(coords.latitude, coords.longitude);

    const locationObj: GPSLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      timestamp: isoString,
      displayTime,
      mapsUrl,
    };

    // Check if session already exists for today
    const recordId = `att-${staffId}-${todayStr}`;
    const docRef = doc(db, 'attendanceSessions', recordId);
    const existingSnap = await getDoc(docRef);
    const existing = existingSnap.exists() ? (existingSnap.data() as AttendanceRecord) : null;

    if (existing && existing.dutyStatus === 'duty_on') {
      throw new Error(`Active Duty On session already exists for today (checked in at ${existing.checkIn}).`);
    }

    const newRecord: AttendanceRecord = {
      id: recordId,
      sessionId: existing?.sessionId || `sess-${staffId}-${Date.now()}`,
      staffId,
      date: todayStr,
      status: 'present',
      dutyStatus: 'duty_on',
      checkIn: timeOnly,
      checkInTimestamp: isoString,
      checkInLocation: locationObj,
      checkInDistanceMeters: distance,
      checkInVerification: verification,
      notes: 'Duty On recorded via GPS Geolocation',
    };

    await setDoc(docRef, {
      ...newRecord,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newRecord;
  }

  /**
   * Record Duty Off (Check-out) - Preserves original check-in coordinates
   */
  async recordDutyOff(
    staffId: string,
    coords: { latitude: number; longitude: number; accuracy: number },
    settings: CompanySettings
  ): Promise<AttendanceRecord> {
    const todayStr = this.getTodayDateString();
    const office = settings.officeGeofence || {
      latitude: 28.6289,
      longitude: 77.2219,
      radiusMeters: 300,
      enabled: true,
    };

    const distance = calculateHaversineDistanceMeters(
      coords.latitude,
      coords.longitude,
      office.latitude,
      office.longitude
    );

    let verification: LocationVerificationStatus = 'within_geofence';
    if (coords.accuracy > 500) {
      verification = 'needs_review';
    } else if (office.enabled && distance > office.radiusMeters) {
      verification = 'outside_geofence';
    } else {
      verification = 'within_geofence';
    }

    const { displayTime, timeOnly, isoString } = getISTTimestamp(new Date());
    const mapsUrl = getGoogleMapsUrl(coords.latitude, coords.longitude);

    const locationObj: GPSLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      timestamp: isoString,
      displayTime,
      mapsUrl,
    };

    const recordId = `att-${staffId}-${todayStr}`;
    const docRef = doc(db, 'attendanceSessions', recordId);
    const existingSnap = await getDoc(docRef);
    const existing = existingSnap.exists() ? (existingSnap.data() as AttendanceRecord) : null;

    const duration = computeSessionDuration(existing?.checkInTimestamp, isoString);

    const updatedRecord: AttendanceRecord = {
      id: recordId,
      sessionId: existing?.sessionId || `sess-${staffId}-${Date.now()}`,
      staffId,
      date: todayStr,
      status: 'present',
      dutyStatus: 'duty_completed',
      // PRESERVE check-in details
      checkIn: existing?.checkIn || timeOnly,
      checkInTimestamp: existing?.checkInTimestamp || isoString,
      checkInLocation: existing?.checkInLocation,
      checkInDistanceMeters: existing?.checkInDistanceMeters,
      checkInVerification: existing?.checkInVerification,
      // Check-out details
      checkOut: timeOnly,
      checkOutTimestamp: isoString,
      checkOutLocation: locationObj,
      checkOutDistanceMeters: distance,
      checkOutVerification: verification,
      workingHours: duration.hours > 0 ? duration.hours : (existing?.workingHours || 0),
      sessionDurationText: duration.durationText,
      notes: existing?.notes
        ? `${existing.notes} | Duty Off recorded via GPS Geolocation`
        : 'Duty Off recorded via GPS Geolocation',
    };

    await setDoc(
      docRef,
      {
        ...updatedRecord,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return updatedRecord;
  }

  /**
   * Upsert arbitrary attendance record (for admin adjustments)
   */
  async upsertAttendance(record: AttendanceRecord): Promise<void> {
    const recordId = record.id || `att-${record.staffId}-${record.date}`;
    const docRef = doc(db, 'attendanceSessions', recordId);
    await setDoc(
      docRef,
      {
        ...record,
        id: recordId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Real-time subscription to attendance sessions
   */
  subscribeAttendance(
    callback: (records: AttendanceRecord[]) => void,
    staffIdFilter?: string
  ): () => void {
    const colRef = collection(db, 'attendanceSessions');
    const q = staffIdFilter
      ? query(colRef, where('staffId', '==', staffIdFilter))
      : colRef;

    return onSnapshot(
      q,
      (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as AttendanceRecord;
          if (!isDemoAttendance(item)) {
            list.push(item);
          }
        });
        callback(list);
      },
      (error) => {
        console.error('Error listening to attendance collection:', error);
      }
    );
  }
}

export const attendanceService = new AttendanceService();
