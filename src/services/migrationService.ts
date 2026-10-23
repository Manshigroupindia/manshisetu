// Automatic Idempotent Data Migration & Cleanup Service for Manshi Group Setu

import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db, auth, AUTHORIZED_DIRECTOR_EMAIL } from '../lib/firebase';
import { MigrationStatus } from '../types';
import {
  isDemoStaff,
  isDemoWork,
  isDemoAttendance,
  isDemoExpense,
  isDemoAdvance,
  isDemoSalary,
  isDemoNotice,
  isDemoHoliday,
  isDemoEvent,
  isDemoResource,
} from '../utils/demoDataFilter';

export interface MigrationResult {
  completed: boolean;
  alreadyMigrated: boolean;
  counts: Record<string, number>;
  error?: string;
}

export class MigrationService {
  private isRunning = false;

  /**
   * Check if the migration status document in Firestore indicates completion
   */
  async getMigrationStatus(): Promise<MigrationStatus | null> {
    try {
      const docRef = doc(db, 'systemMetadata', 'initialMigration');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          completed: !!data.completed,
          migratedAt: data.migratedAt?.toDate ? data.migratedAt.toDate().toISOString() : data.migratedAt || new Date().toISOString(),
          migratedBy: data.migratedBy || '',
          counts: data.counts || {},
        };
      }
      return null;
    } catch (err) {
      console.warn('Could not read migration status:', err);
      return null;
    }
  }

  /**
   * Safe migration & database cleanup.
   * NEVER seeds demo or mock data into Firestore.
   * Proactively purges any legacy sample/demo records from Firestore.
   * Strictly restricted to the authorized Director account.
   */
  async runAutoMigration(): Promise<MigrationResult> {
    if (this.isRunning) {
      return { completed: false, alreadyMigrated: false, counts: {} };
    }

    const currentUser = auth.currentUser;
    const currentEmail = (currentUser?.email || '').trim().toLowerCase();

    // Verify caller is authorized Director
    if (!currentUser || currentEmail !== AUTHORIZED_DIRECTOR_EMAIL) {
      return {
        completed: false,
        alreadyMigrated: false,
        counts: {},
        error: 'Only the Director may initiate database migration.',
      };
    }

    this.isRunning = true;

    try {
      // 1. Proactively clean any legacy demo records from Firestore
      const cleanResult = await this.cleanDemoRecordsFromFirestore();

      // 2. Mark clean status in Firestore systemMetadata
      const statusRef = doc(db, 'systemMetadata', 'initialMigration');
      await setDoc(
        statusRef,
        {
          completed: true,
          migratedAt: serverTimestamp(),
          migratedBy: currentEmail,
          counts: { cleanedDemoRecords: cleanResult.deleted },
        },
        { merge: true }
      );

      this.isRunning = false;
      return {
        completed: true,
        alreadyMigrated: true,
        counts: { cleanedDemoRecords: cleanResult.deleted },
      };
    } catch (err: any) {
      this.isRunning = false;
      console.warn('Auto-migration cleanup error:', err);
      return {
        completed: false,
        alreadyMigrated: false,
        counts: {},
        error: err.message,
      };
    }
  }

  /**
   * Safely deletes all known sample/demo records from Firestore if they were previously seeded.
   * Never deletes real user data, staff profiles, or legitimate production records.
   */
  async cleanDemoRecordsFromFirestore(): Promise<{ deleted: number }> {
    const currentUser = auth.currentUser;
    const currentEmail = (currentUser?.email || '').trim().toLowerCase();
    if (!currentUser || currentEmail !== AUTHORIZED_DIRECTOR_EMAIL) {
      throw new Error('Only the Director is authorized to clean demo records.');
    }

    let deleted = 0;
    let batch = writeBatch(db);
    let opCount = 0;

    const stageDelete = async (ref: any) => {
      batch.delete(ref);
      deleted++;
      opCount++;
      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    };

    // 1. Clean expenses
    try {
      const snap = await getDocs(collection(db, 'expenses'));
      for (const d of snap.docs) {
        const data = d.data();
        if (isDemoExpense(data as any) || /^exp-[1-9]\d*$/i.test(d.id)) {
          await stageDelete(d.ref);
        }
      }
    } catch (e) {
      console.warn('Expenses cleanup error:', e);
    }

    // 2. Clean salary advances
    try {
      const snap = await getDocs(collection(db, 'salaryAdvances'));
      for (const d of snap.docs) {
        const data = d.data();
        if (isDemoAdvance(data as any) || /^adv-[1-9]\d*$/i.test(d.id)) {
          await stageDelete(d.ref);
        }
      }
    } catch (e) {
      console.warn('Advances cleanup error:', e);
    }

    // 3. Clean salary records
    try {
      const snap = await getDocs(collection(db, 'salaryRecords'));
      for (const d of snap.docs) {
        const data = d.data();
        if (isDemoSalary(data as any) || ['staff-1', 'staff-2', 'staff-3', 'staff-4', 'staff-5'].includes(data.staffId)) {
          await stageDelete(d.ref);
        }
      }
    } catch (e) {
      console.warn('Salary records cleanup error:', e);
    }

    // 4. Clean attendance sessions
    try {
      const snap = await getDocs(collection(db, 'attendanceSessions'));
      for (const d of snap.docs) {
        const data = d.data();
        if (isDemoAttendance(data as any)) {
          await stageDelete(d.ref);
        }
      }
    } catch (e) {
      console.warn('Attendance cleanup error:', e);
    }

    // 5. Clean work assignments
    try {
      const snap = await getDocs(collection(db, 'workAssignments'));
      for (const d of snap.docs) {
        const data = d.data();
        if (isDemoWork(data as any) || /^task-[1-9]\d*$/i.test(d.id)) {
          await stageDelete(d.ref);
        }
      }
    } catch (e) {
      console.warn('Work assignments cleanup error:', e);
    }

    // 6. Clean staff (only confirmed demo staff)
    try {
      const snap = await getDocs(collection(db, 'staff'));
      for (const d of snap.docs) {
        const data = d.data();
        if (
          isDemoStaff(data as any) ||
          ['staff-1', 'staff-2', 'staff-3', 'staff-4', 'staff-5', 'mgs-101', 'mgs-102', 'mgs-103', 'mgs-104', 'mgs-105'].includes(d.id.toLowerCase())
        ) {
          await stageDelete(d.ref);
        }
      }
    } catch (e) {
      console.warn('Staff cleanup error:', e);
    }

    // 7. Clean notices
    try {
      const snap = await getDocs(collection(db, 'notices'));
      for (const d of snap.docs) {
        const data = d.data();
        if (isDemoNotice(data as any) || /^not-[1-9]\d*$/i.test(d.id)) {
          await stageDelete(d.ref);
        }
      }
    } catch (e) {
      console.warn('Notices cleanup error:', e);
    }

    // 8. Clean holidays
    try {
      const snap = await getDocs(collection(db, 'holidays'));
      for (const d of snap.docs) {
        const data = d.data();
        if (isDemoHoliday(data as any) || /^hol-[1-9]\d*$/i.test(d.id)) {
          await stageDelete(d.ref);
        }
      }
    } catch (e) {
      console.warn('Holidays cleanup error:', e);
    }

    // 9. Clean officeEvents and legacy events
    for (const colName of ['officeEvents', 'events']) {
      try {
        const snap = await getDocs(collection(db, colName));
        for (const d of snap.docs) {
          const data = d.data();
          if (isDemoEvent(data as any) || /^eve-[1-9]\d*$/i.test(d.id)) {
            await stageDelete(d.ref);
          }
        }
      } catch (e: any) {
        console.warn(`[Cleanup] ${colName} query error [${e?.code || 'unknown'}]:`, e?.message || e);
      }
    }

    // 10. Clean companyResources and legacy resources
    for (const colName of ['companyResources', 'resources']) {
      try {
        const snap = await getDocs(collection(db, colName));
        for (const d of snap.docs) {
          const data = d.data();
          if (isDemoResource(data as any) || /^res-[1-9]\d*$/i.test(d.id)) {
            await stageDelete(d.ref);
          }
        }
      } catch (e: any) {
        console.warn(`[Cleanup] ${colName} query error [${e?.code || 'unknown'}]:`, e?.message || e);
      }
    }

    if (opCount > 0) {
      await batch.commit();
      console.log(`Successfully cleaned ${deleted} demo/sample records from Firestore.`);
    }

    return { deleted };
  }
}

export const migrationService = new MigrationService();
