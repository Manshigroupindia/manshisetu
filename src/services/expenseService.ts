// Expense Management Service for Manshi Group Setu

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Expense } from '../types';
import { isDemoExpense } from '../utils/demoDataFilter';

export class ExpenseService {
  async addExpense(expense: Expense): Promise<void> {
    const id = expense.id || `exp-${Date.now()}`;
    const docRef = doc(db, 'expenses', id);
    await setDoc(docRef, {
      ...expense,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async updateExpense(expense: Expense): Promise<void> {
    const docRef = doc(db, 'expenses', expense.id);
    await setDoc(
      docRef,
      {
        ...expense,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async deleteExpense(id: string): Promise<void> {
    await deleteDoc(doc(db, 'expenses', id));
  }

  subscribeExpenses(
    callback: (expenses: Expense[]) => void,
    staffIdFilter?: string
  ): () => void {
    const colRef = collection(db, 'expenses');
    const q = staffIdFilter
      ? query(colRef, where('staffId', '==', staffIdFilter))
      : colRef;

    return onSnapshot(
      q,
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as Expense;
          if (!isDemoExpense(item)) {
            list.push(item);
          }
        });
        callback(list);
      },
      (error) => {
        console.error('Error listening to expenses collection:', error);
      }
    );
  }
}

export const expenseService = new ExpenseService();
