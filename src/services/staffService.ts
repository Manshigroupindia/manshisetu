// Staff Management Service with Secure Provisioning for Manshi Group Setu

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  addDoc,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, firebaseConfig, functions, AUTHORIZED_DIRECTOR_EMAIL } from '../lib/firebase';
import { Staff, UserProfile } from '../types';
import { storageService } from './storageService';
import { isDemoStaff } from '../utils/demoDataFilter';
import { sanitizeFirestorePayload } from '../utils/firestoreUtils';

export class StaffService {
  /**
   * Provision a new staff member:
   * 1. Creates Firebase Auth user using isolated secondary instance (preserving director's session)
   * 2. Writes users/{uid} authorization document (sanitized)
   * 3. Writes staff/{employeeId} employee record (sanitized)
   * 4. Logs audit entry
   */
  async createStaffMember(
    staffData: Staff,
    initialPassword?: string
  ): Promise<{ staff: Staff; uid: string }> {
    const currentUser = auth.currentUser;
    const currentEmail = (currentUser?.email || '').trim().toLowerCase();

    // Verify caller is the authorized director
    if (!currentUser || currentEmail !== AUTHORIZED_DIRECTOR_EMAIL) {
      throw new Error('Unauthorized: Only the Director can provision new staff accounts.');
    }

    const email = staffData.officialEmail.trim().toLowerCase();
    const employeeId = staffData.employeeId.trim().toUpperCase();

    // Ensure employeeId does not already exist
    const staffDocRef = doc(db, 'staff', employeeId);
    const existingSnap = await getDoc(staffDocRef);
    if (existingSnap.exists()) {
      throw new Error(`An employee with ID "${employeeId}" already exists in the system.`);
    }

    // Default secure initial password if not explicitly supplied
    const password = initialPassword && initialPassword.trim().length >= 6
      ? initialPassword.trim()
      : `Manshi@${employeeId.replace(/[^a-zA-Z0-9]/g, '')}2026`;

    let createdUid = '';
    const secondaryAppName = `StaffProvision_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 1. Create Firebase Auth user in secondary isolated auth instance
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      createdUid = userCredential.user.uid;
      await signOut(secondaryAuth);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error(`The email "${email}" is already registered in Firebase Authentication.`);
      } else if (err.code === 'auth/weak-password') {
        throw new Error('Assigned initial password is too weak. Minimum 6 characters required.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error(`The email address "${email}" is invalid.`);
      }
      throw new Error(`Failed to create Firebase Auth account: ${err.message}`);
    } finally {
      // Clean up secondary app instance
      try {
        await deleteApp(secondaryApp);
      } catch (cleanErr) {
        console.warn('Could not cleanly delete secondary Firebase app:', cleanErr);
      }
    }

    // 2. Create users/{uid} authorization document (Sanitized)
    const userDocRef = doc(db, 'users', createdUid);
    const userProfile: UserProfile = {
      uid: createdUid,
      email,
      role: 'staff',
      employeeId,
      active: staffData.status !== 'inactive',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sanitizedUserPayload = sanitizeFirestorePayload({
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(userDocRef, sanitizedUserPayload);

    // 3. Create staff/{employeeId} employee record (Sanitized: undefined values omitted)
    const staffRecord: Staff = {
      ...staffData,
      id: staffData.id || `staff-${employeeId}`,
      employeeId,
      officialEmail: email,
    };

    const sanitizedStaffPayload = sanitizeFirestorePayload({
      ...staffRecord,
      uid: createdUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(staffDocRef, sanitizedStaffPayload);

    // 4. Record audit log
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action: 'STAFF_PROVISIONED',
        performedBy: currentEmail,
        targetId: employeeId,
        details: `Provisioned account for ${staffRecord.fullName} (${email}) with initial password`,
        timestamp: serverTimestamp(),
      });
    } catch (auditErr) {
      console.warn('Could not record audit log:', auditErr);
    }

    return { staff: staffRecord, uid: createdUid };
  }

  /**
   * Update existing staff profile with sanitized Firestore payload
   */
  async updateStaff(staffData: Staff): Promise<void> {
    const employeeId = staffData.employeeId.trim();
    const staffDocRef = doc(db, 'staff', employeeId);

    const sanitizedUpdate = sanitizeFirestorePayload({
      ...staffData,
      updatedAt: serverTimestamp(),
    });

    await setDoc(staffDocRef, sanitizedUpdate, { merge: true });

    // If status changed to inactive, update users/{uid}
    try {
      const q = query(collection(db, 'users'), where('employeeId', '==', employeeId));
      const snap = await getDocs(q);
      snap.forEach(async (uDoc) => {
        await updateDoc(doc(db, 'users', uDoc.id), {
          active: staffData.status !== 'inactive',
          updatedAt: serverTimestamp(),
        });
      });
    } catch (err) {
      console.warn('Error updating linked users document active status:', err);
    }
  }

  /**
   * Helper to resolve staff document and exact employee ID from either staff.id or staff.employeeId
   */
  private async resolveStaffDoc(idOrEmployeeId: string) {
    const raw = (idOrEmployeeId || '').trim();
    if (!raw) return null;

    // 1. Direct match by employeeId key (e.g. MGS-101)
    const directRef = doc(db, 'staff', raw);
    const directSnap = await getDoc(directRef);
    if (directSnap.exists()) {
      return { ref: directRef, data: directSnap.data() as Staff, employeeId: raw };
    }

    // 2. Try uppercase if employeeId was passed lowercase
    const upperRef = doc(db, 'staff', raw.toUpperCase());
    const upperSnap = await getDoc(upperRef);
    if (upperSnap.exists()) {
      return { ref: upperRef, data: upperSnap.data() as Staff, employeeId: raw.toUpperCase() };
    }

    // 3. Query staff by employeeId field
    const q1 = query(collection(db, 'staff'), where('employeeId', '==', raw));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const docSnap = snap1.docs[0];
      return { ref: docSnap.ref, data: docSnap.data() as Staff, employeeId: (docSnap.data() as Staff).employeeId };
    }

    // 4. Query staff by id field
    const q2 = query(collection(db, 'staff'), where('id', '==', raw));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const docSnap = snap2.docs[0];
      return { ref: docSnap.ref, data: docSnap.data() as Staff, employeeId: (docSnap.data() as Staff).employeeId };
    }

    return null;
  }

  /**
   * Deactivate staff account - Disables portal login and marks status as inactive
   */
  async deactivateStaff(idOrEmployeeId: string): Promise<void> {
    const currentUser = auth.currentUser;
    const currentEmail = (currentUser?.email || '').trim().toLowerCase();
    if (!currentUser || currentEmail !== AUTHORIZED_DIRECTOR_EMAIL) {
      throw new Error('Unauthorized: Only the Director can deactivate staff accounts.');
    }

    const resolved = await this.resolveStaffDoc(idOrEmployeeId);
    const employeeId = resolved ? resolved.employeeId : idOrEmployeeId.trim();

    if (resolved) {
      // 1. Update staff document
      await updateDoc(resolved.ref, {
        status: 'inactive',
        updatedAt: serverTimestamp(),
      });

      // 2. Mark linked users/{uid} authorization record as inactive
      try {
        const q = query(collection(db, 'users'), where('employeeId', '==', employeeId));
        const snap = await getDocs(q);
        for (const uDoc of snap.docs) {
          await updateDoc(doc(db, 'users', uDoc.id), {
            active: false,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (userErr) {
        console.warn('Could not update users document active flag:', userErr);
      }

      // 3. Record audit log
      try {
        await addDoc(collection(db, 'auditLogs'), {
          action: 'STAFF_DEACTIVATED',
          performedBy: currentEmail,
          targetId: employeeId,
          details: `Staff member ${resolved.data.fullName} (${employeeId}) account deactivated by Director. Portal login disabled.`,
          timestamp: serverTimestamp(),
        });
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr);
      }
    }

    // Sync local storage
    storageService.deactivateStaff(employeeId);
  }

  /**
   * Reactivate staff account - Re-enables portal login and marks status as active
   */
  async reactivateStaff(idOrEmployeeId: string): Promise<void> {
    const currentUser = auth.currentUser;
    const currentEmail = (currentUser?.email || '').trim().toLowerCase();
    if (!currentUser || currentEmail !== AUTHORIZED_DIRECTOR_EMAIL) {
      throw new Error('Unauthorized: Only the Director can reactivate staff accounts.');
    }

    const resolved = await this.resolveStaffDoc(idOrEmployeeId);
    const employeeId = resolved ? resolved.employeeId : idOrEmployeeId.trim();

    if (resolved) {
      // 1. Update staff document
      await updateDoc(resolved.ref, {
        status: 'active',
        updatedAt: serverTimestamp(),
      });

      // 2. Mark linked users/{uid} authorization record as active
      try {
        const q = query(collection(db, 'users'), where('employeeId', '==', employeeId));
        const snap = await getDocs(q);
        for (const uDoc of snap.docs) {
          await updateDoc(doc(db, 'users', uDoc.id), {
            active: true,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (userErr) {
        console.warn('Could not update users document active flag:', userErr);
      }

      // 3. Record audit log
      try {
        await addDoc(collection(db, 'auditLogs'), {
          action: 'STAFF_REACTIVATED',
          performedBy: currentEmail,
          targetId: employeeId,
          details: `Staff member ${resolved.data.fullName} (${employeeId}) account reactivated by Director. Portal login enabled.`,
          timestamp: serverTimestamp(),
        });
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr);
      }
    }

    // Sync local storage
    storageService.reactivateStaff(employeeId);
  }

  /**
   * Permanently delete staff account:
   * 1. Invokes trusted backend Cloud Function (deleteStaffAccount) to permanently delete or disable
   *    the Firebase Authentication user account via Admin SDK.
   * 2. Atomically removes staff/{employeeId} profile document and linked users/{uid} authorization document.
   * 3. Cleans up active uncompleted assignments specifically assigned to this employee.
   * 4. CRUCIAL SAFETY: Historical attendance records, salary slips, advances, expenses, and audit logs
   *    are SAFELY AND PERMANENTLY PRESERVED for regulatory and financial audit compliance.
   */
  async deleteStaff(idOrEmployeeId: string): Promise<{ success: boolean; employeeId: string; authDeleted: boolean }> {
    const currentUser = auth.currentUser;
    const currentEmail = (currentUser?.email || '').trim().toLowerCase();
    const PROTECTED_DIRECTOR_EMAILS = [
      'devenjhaofficial@gmail.com',
      'devenjhaoffical@gmail.com',
      AUTHORIZED_DIRECTOR_EMAIL.toLowerCase(),
    ];

    if (!currentUser || !PROTECTED_DIRECTOR_EMAILS.includes(currentEmail)) {
      throw new Error('Unauthorized: Only the Director is authorized to permanently delete staff accounts.');
    }

    const resolved = await this.resolveStaffDoc(idOrEmployeeId);
    const employeeId = (resolved ? resolved.employeeId : idOrEmployeeId.trim()).toUpperCase();
    let uid = resolved?.data?.uid;

    const targetEmail = (resolved?.data?.officialEmail || '').trim().toLowerCase();
    if (
      PROTECTED_DIRECTOR_EMAILS.includes(targetEmail) ||
      PROTECTED_DIRECTOR_EMAILS.includes(employeeId.toLowerCase()) ||
      (uid && uid === currentUser.uid)
    ) {
      throw new Error('Security Violation: The Director / Administrator account can never be deleted through staff management.');
    }

    if (!uid) {
      try {
        const q = query(collection(db, 'users'), where('employeeId', '==', employeeId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          uid = snap.docs[0].id;
        }
      } catch (e) {
        console.warn('Could not query users collection for uid:', e);
      }
    }

    // Call secure, trusted backend Cloud Function (deleteStaffAccount) which uses Firebase Admin SDK
    const deleteFn = httpsCallable<
      { employeeId: string; uid?: string },
      { success: boolean; employeeId: string; uid?: string; authDeleted: boolean }
    >(functions, 'deleteStaffAccount');

    try {
      const res = await deleteFn({ employeeId, uid });

      // Sync local storage on backend success
      storageService.deleteStaff(employeeId);

      return {
        success: true,
        employeeId,
        authDeleted: res.data?.authDeleted ?? true,
      };
    } catch (err: any) {
      console.error('deleteStaffAccount backend call failed:', err);
      const detail = err?.message || 'Backend service failed to process deletion request.';
      // Under no circumstances do we delete Firestore profiles when backend Auth deletion fails!
      // This prevents orphan Auth accounts, prevents false reporting of deletion,
      // and allows the administrator to safely retry without creating inconsistent records.
      throw new Error(
        `Failed to delete Firebase Authentication account: ${detail}. The staff profile was NOT deleted. Please verify Cloud Function backend deployment and retry.`
      );
    }
  }

  /**
   * Staff updates their own personal address and alternate contact (sanitized)
   */
  async updateStaffPersonalProfile(
    employeeId: string,
    partial: { alternateContact?: string; address?: string }
  ): Promise<void> {
    const staffDocRef = doc(db, 'staff', employeeId);
    const sanitizedPartial = sanitizeFirestorePayload({
      ...partial,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(staffDocRef, sanitizedPartial);
  }

  /**
   * Real-time subscription to all staff members
   */
  subscribeStaff(callback: (staff: Staff[]) => void): () => void {
    const staffRef = collection(db, 'staff');
    return onSnapshot(
      staffRef,
      (snapshot) => {
        const staffList: Staff[] = [];
        const seen = new Set<string>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Staff;
          const canonicalId = (data.employeeId || docSnap.id).trim().toUpperCase();
          const item: Staff = {
            ...data,
            id: data.id || docSnap.id,
            employeeId: canonicalId,
          };
          if (!isDemoStaff(item) && !seen.has(canonicalId)) {
            seen.add(canonicalId);
            staffList.push(item);
          }
        });
        callback(staffList);
      },
      (error) => {
        console.error('Error listening to staff collection:', error);
      }
    );
  }

  /**
   * Get all staff once
   */
  async getStaffList(): Promise<Staff[]> {
    const snapshot = await getDocs(collection(db, 'staff'));
    const staffList: Staff[] = [];
    const seen = new Set<string>();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Staff;
      const canonicalId = (data.employeeId || docSnap.id).trim().toUpperCase();
      const item: Staff = {
        ...data,
        id: data.id || docSnap.id,
        employeeId: canonicalId,
      };
      if (!isDemoStaff(item) && !seen.has(canonicalId)) {
        seen.add(canonicalId);
        staffList.push(item);
      }
    });
    return staffList;
  }
}

export const staffService = new StaffService();
