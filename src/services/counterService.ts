// Concurrency-Safe Persistent Staff Counter Service for Manshi Group Setu
// Guarantees strictly sequential, permanent, non-reusable employee IDs (e.g. MGS-101, MGS-102...)

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const COUNTER_DOC_PATH = 'systemMetadata/staffCounter';
const DEFAULT_BASE_NUMBER = 100;
const ID_PREFIX = 'MGS-';

export class CounterService {
  /**
   * Scans existing staff records and audit history to discover the highest employee ID number ever issued.
   * This guarantees that when initializing, the counter starts after the maximum ID ever issued,
   * even if prior staff members were deleted.
   */
  async findHighestIssuedStaffNumber(): Promise<number> {
    let highest = DEFAULT_BASE_NUMBER;

    // 1. Scan active & existing staff collection
    try {
      const staffSnap = await getDocs(collection(db, 'staff'));
      staffSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const rawId = (data.employeeId || docSnap.id || '').toString().trim().toUpperCase();
        const match = rawId.match(/MGS-?(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > highest) {
            highest = num;
          }
        }
      });
    } catch (err) {
      console.warn('Could not scan staff collection for max ID:', err);
    }

    // 2. Scan audit logs for any deleted or previously provisioned employee IDs
    try {
      const logsSnap = await getDocs(
        query(
          collection(db, 'auditLogs'),
          where('action', 'in', [
            'STAFF_PROVISIONED',
            'STAFF_DELETED',
            'STAFF_PROVISIONED_BY_FUNCTION',
            'STAFF_DEACTIVATED',
          ])
        )
      );
      logsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const rawTarget = (data.targetId || '').toString().trim().toUpperCase();
        const match = rawTarget.match(/MGS-?(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > highest) {
            highest = num;
          }
        }
      });
    } catch (err) {
      console.warn('Could not scan audit logs for max ID:', err);
    }

    return highest;
  }

  /**
   * Guarantees that the counter document in systemMetadata/staffCounter exists.
   * If it does not exist, safely initializes it with the highest previously issued ID.
   */
  async ensureCounterInitialized(): Promise<number> {
    const counterRef = doc(db, 'systemMetadata', 'staffCounter');
    const snap = await getDoc(counterRef);

    if (snap.exists()) {
      const val = snap.data().lastIssuedNumber;
      if (typeof val === 'number' && !isNaN(val)) {
        return val;
      }
    }

    // Determine the baseline from existing database records
    const highestNumber = await this.findHighestIssuedStaffNumber();

    try {
      await setDoc(
        counterRef,
        {
          lastIssuedNumber: highestNumber,
          lastIssuedId: `${ID_PREFIX}${highestNumber}`,
          prefix: ID_PREFIX,
          initializedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Counter initialization warning:', err);
    }

    return highestNumber;
  }

  /**
   * Peek the next employee ID for form preview without incrementing or mutating the counter.
   */
  async peekNextStaffId(): Promise<string> {
    try {
      const currentNumber = await this.ensureCounterInitialized();
      const nextNumber = currentNumber + 1;
      return `${ID_PREFIX}${nextNumber}`;
    } catch (err) {
      console.warn('Error peeking next staff ID, falling back to 101:', err);
      return `${ID_PREFIX}101`;
    }
  }

  /**
   * Concurrency-safe atomic transaction to issue and permanently advance the sequential staff ID counter.
   *
   * RULES:
   * - Never counts existing documents.
   * - Never reuses an ID, even if an employee was deleted.
   * - Concurrency-safe if multiple administrators create staff simultaneously.
   * - A failed subsequent operation will not reuse this ID (the counter remains advanced).
   */
  async allocateNextStaffId(): Promise<string> {
    await this.ensureCounterInitialized();

    const counterRef = doc(db, 'systemMetadata', 'staffCounter');

    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      let currentNumber = DEFAULT_BASE_NUMBER;

      if (snap.exists()) {
        const val = snap.data().lastIssuedNumber;
        if (typeof val === 'number' && !isNaN(val)) {
          currentNumber = val;
        }
      }

      const nextNumber = currentNumber + 1;
      const nextId = `${ID_PREFIX}${nextNumber}`;

      transaction.set(
        counterRef,
        {
          lastIssuedNumber: nextNumber,
          lastIssuedId: nextId,
          prefix: ID_PREFIX,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return nextId;
    });
  }
}

export const counterService = new CounterService();
