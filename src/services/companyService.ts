// Company Settings, Holidays, Events, Resources and Audit Service for Manshi Group Setu

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  CompanySettings,
  Holiday,
  OfficeEvent,
  CompanyResource,
  AuditLog,
} from '../types';
import { defaultSettings } from './storageService';
import {
  isDemoHoliday,
  isDemoEvent,
  isDemoResource,
} from '../utils/demoDataFilter';

export class CompanyService {
  // --- Company Settings ---
  async getSettings(): Promise<CompanySettings> {
    const docRef = doc(db, 'companySettings', 'general');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CompanySettings;
    }
    return defaultSettings;
  }

  async saveSettings(settings: CompanySettings): Promise<void> {
    const docRef = doc(db, 'companySettings', 'general');
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  subscribeSettings(callback: (settings: CompanySettings) => void): () => void {
    const docRef = doc(db, 'companySettings', 'general');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as CompanySettings);
        } else {
          callback(defaultSettings);
        }
      },
      (error) => {
        console.error('Error listening to companySettings:', error);
      }
    );
  }

  // --- Holidays ---
  async addHoliday(holiday: Holiday): Promise<void> {
    const id = holiday.id || `hol-${Date.now()}`;
    const docRef = doc(db, 'holidays', id);
    await setDoc(docRef, { ...holiday, id, createdAt: serverTimestamp() });
  }

  async updateHoliday(holiday: Holiday): Promise<void> {
    const docRef = doc(db, 'holidays', holiday.id);
    await setDoc(docRef, { ...holiday, updatedAt: serverTimestamp() }, { merge: true });
  }

  async deleteHoliday(id: string): Promise<void> {
    await deleteDoc(doc(db, 'holidays', id));
  }

  subscribeHolidays(callback: (holidays: Holiday[]) => void): () => void {
    const colRef = collection(db, 'holidays');
    return onSnapshot(colRef, (snapshot) => {
      const list: Holiday[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as Holiday;
        if (!isDemoHoliday(item)) {
          list.push(item);
        }
      });
      callback(list);
    });
  }

  // --- Events ---
  async addEvent(event: OfficeEvent): Promise<void> {
    const id = event.id || `evt-${Date.now()}`;
    const docRef = doc(db, 'officeEvents', id);
    await setDoc(docRef, { ...event, id, createdAt: serverTimestamp() });
  }

  async updateEvent(event: OfficeEvent): Promise<void> {
    const docRef = doc(db, 'officeEvents', event.id);
    await setDoc(docRef, { ...event, updatedAt: serverTimestamp() }, { merge: true });
  }

  async deleteEvent(id: string): Promise<void> {
    await deleteDoc(doc(db, 'officeEvents', id));
  }

  subscribeEvents(callback: (events: OfficeEvent[]) => void): () => void {
    const colRef = collection(db, 'officeEvents');
    return onSnapshot(colRef, (snapshot) => {
      const list: OfficeEvent[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as OfficeEvent;
        if (!isDemoEvent(item)) {
          list.push(item);
        }
      });
      callback(list);
    });
  }

  // --- Company Resources ---
  async addResource(resource: CompanyResource): Promise<void> {
    const id = resource.id || `res-${Date.now()}`;
    const docRef = doc(db, 'companyResources', id);
    await setDoc(docRef, { ...resource, id, createdAt: serverTimestamp() });
  }

  async updateResource(resource: CompanyResource): Promise<void> {
    const docRef = doc(db, 'companyResources', resource.id);
    await setDoc(docRef, { ...resource, updatedAt: serverTimestamp() }, { merge: true });
  }

  async deleteResource(id: string): Promise<void> {
    await deleteDoc(doc(db, 'companyResources', id));
  }

  subscribeResources(callback: (resources: CompanyResource[]) => void): () => void {
    const colRef = collection(db, 'companyResources');
    return onSnapshot(colRef, (snapshot) => {
      const list: CompanyResource[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as CompanyResource;
        if (!isDemoResource(item)) {
          list.push(item);
        }
      });
      callback(list);
    });
  }

  // --- Audit Logs ---
  async logAudit(action: string, targetId?: string, details?: string): Promise<void> {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        performedBy: auth.currentUser?.email || 'System',
        targetId,
        details,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Audit logging failed:', err);
    }
  }
}

export const companyService = new CompanyService();
