// Salary & Advances Processing Service for Manshi Group Setu

import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { SalaryRecord, SalaryAdvance } from '../types';
import { isDemoSalary, isDemoAdvance } from '../utils/demoDataFilter';

export class SalaryService {
  /**
   * Save finalized salary record with audit details
   */
  async saveSalaryRecord(record: SalaryRecord): Promise<void> {
    const id = record.id || `sal-${record.staffId}-${record.month}`;
    const docRef = doc(db, 'salaryRecords', id);

    await setDoc(
      docRef,
      {
        ...record,
        id,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Audit log
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action: 'SALARY_PROCESSED',
        performedBy: auth.currentUser?.email || 'Admin',
        targetId: id,
        details: `Processed salary payment for ${record.staffName} (${record.month}) — Amount: ₹${record.finalPayable}`,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Salary audit log error:', err);
    }
  }

  /**
   * Add new salary advance
   */
  async addSalaryAdvance(advance: SalaryAdvance): Promise<void> {
    const id = advance.id || `adv-${Date.now()}`;
    const docRef = doc(db, 'salaryAdvances', id);
    await setDoc(docRef, {
      ...advance,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Update salary advance (e.g. balance deduction after salary payment)
   */
  async updateSalaryAdvance(advance: SalaryAdvance): Promise<void> {
    const docRef = doc(db, 'salaryAdvances', advance.id);
    await setDoc(
      docRef,
      {
        ...advance,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Real-time subscription to salary records
   */
  subscribeSalaries(
    callback: (records: SalaryRecord[]) => void,
    staffIdFilter?: string
  ): () => void {
    const colRef = collection(db, 'salaryRecords');
    const q = staffIdFilter
      ? query(colRef, where('staffId', '==', staffIdFilter))
      : colRef;

    return onSnapshot(
      q,
      (snapshot) => {
        const list: SalaryRecord[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as SalaryRecord;
          if (!isDemoSalary(item)) {
            list.push(item);
          }
        });
        callback(list);
      },
      (error) => {
        console.error('Error listening to salaryRecords:', error);
      }
    );
  }

  /**
   * Real-time subscription to salary advances
   */
  subscribeAdvances(
    callback: (advances: SalaryAdvance[]) => void,
    staffIdFilter?: string
  ): () => void {
    const colRef = collection(db, 'salaryAdvances');
    const q = staffIdFilter
      ? query(colRef, where('staffId', '==', staffIdFilter))
      : colRef;

    return onSnapshot(
      q,
      (snapshot) => {
        const list: SalaryAdvance[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as SalaryAdvance;
          if (!isDemoAdvance(item)) {
            list.push(item);
          }
        });
        callback(list);
      },
      (error) => {
        console.error('Error listening to salaryAdvances:', error);
      }
    );
  }
}

export const salaryService = new SalaryService();
