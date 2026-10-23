// Official Notices Service for Manshi Group Setu

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notice } from '../types';
import { isDemoNotice } from '../utils/demoDataFilter';

export class NoticeService {
  async addNotice(notice: Notice): Promise<void> {
    const id = notice.id || `not-${Date.now()}`;
    const docRef = doc(db, 'notices', id);
    await setDoc(docRef, {
      ...notice,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async updateNotice(notice: Notice): Promise<void> {
    const docRef = doc(db, 'notices', notice.id);
    await setDoc(
      docRef,
      {
        ...notice,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async deleteNotice(id: string): Promise<void> {
    await deleteDoc(doc(db, 'notices', id));
  }

  subscribeNotices(callback: (notices: Notice[]) => void): () => void {
    const colRef = collection(db, 'notices');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Notice[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as Notice;
          if (!isDemoNotice(item)) {
            list.push(item);
          }
        });
        callback(list);
      },
      (error) => {
        console.error('Error listening to notices:', error);
      }
    );
  }
}

export const noticeService = new NoticeService();
