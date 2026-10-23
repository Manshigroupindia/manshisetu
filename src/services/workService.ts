// Work & Task Management Service for Manshi Group Setu

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WorkAssignment, TaskStatus } from '../types';
import { isDemoWork } from '../utils/demoDataFilter';

export class WorkService {
  async addWorkAssignment(assignment: WorkAssignment): Promise<void> {
    const id = assignment.id || `work-${Date.now()}`;
    const docRef = doc(db, 'workAssignments', id);
    await setDoc(docRef, {
      ...assignment,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async updateWorkAssignment(assignment: WorkAssignment): Promise<void> {
    const docRef = doc(db, 'workAssignments', assignment.id);
    await setDoc(
      docRef,
      {
        ...assignment,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async deleteWorkAssignment(id: string): Promise<void> {
    await deleteDoc(doc(db, 'workAssignments', id));
  }

  async updateStaffNotes(
    workId: string,
    newStatus?: TaskStatus,
    progressNotes?: string,
    completedNotes?: string
  ): Promise<void> {
    const docRef = doc(db, 'workAssignments', workId);
    const updates: any = {
      updatedAt: serverTimestamp(),
    };
    if (newStatus !== undefined) updates.status = newStatus;
    if (progressNotes !== undefined) updates.staffProgressNotes = progressNotes;
    if (completedNotes !== undefined) updates.staffCompletedNotes = completedNotes;
    if (newStatus === 'completed') updates.completedAt = new Date().toISOString();

    await updateDoc(docRef, updates);
  }

  subscribeWork(
    callback: (tasks: WorkAssignment[]) => void,
    staffIdFilter?: string
  ): () => void {
    const colRef = collection(db, 'workAssignments');
    const q = staffIdFilter
      ? query(colRef, where('staffId', '==', staffIdFilter))
      : colRef;

    return onSnapshot(
      q,
      (snapshot) => {
        const list: WorkAssignment[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as WorkAssignment;
          if (!isDemoWork(item)) {
            list.push(item);
          }
        });
        callback(list);
      },
      (error) => {
        console.error('Error listening to workAssignments:', error);
      }
    );
  }
}

export const workService = new WorkService();
