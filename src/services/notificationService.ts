// Real-time Notification Engine for Manshi Group Setu
// Backed by Firestore & Web Notifications API with Deduping

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppNotification, NotificationType, NotificationPriority } from '../types';
import { sanitizeFirestorePayload, getCanonicalEmployeeId } from '../utils/firestoreUtils';
import { websocketNotificationService } from './websocketNotificationService';

class NotificationService {
  private lastNotifiedTimestamp = Date.now();
  private displayedNotificationIds = new Set<string>();

  /**
   * Request native browser notification permission
   */
  async requestBrowserPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('Browser Notification permission request failed:', err);
      return 'denied';
    }
  }

  /**
   * Check current browser notification permission status
   */
  getBrowserPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Trigger a native browser notification (when window is blurred or backgrounded)
   */
  showBrowserNotification(notification: AppNotification): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Prevent duplicate browser popups for the same notification
    if (this.displayedNotificationIds.has(notification.id)) return;
    this.displayedNotificationIds.add(notification.id);

    // Keep set bounded to 500 items
    if (this.displayedNotificationIds.size > 500) {
      const first = this.displayedNotificationIds.values().next().value;
      if (first) this.displayedNotificationIds.delete(first);
    }

    try {
      const nativeNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/vite.svg',
        tag: notification.id,
        badge: '/vite.svg',
      });

      nativeNotif.onclick = () => {
        window.focus();
        if (notification.link) {
          window.location.hash = notification.link;
        }
        nativeNotif.close();
      };
    } catch (err) {
      console.warn('Could not display native notification:', err);
    }
  }

  /**
   * Generate a deterministic notification ID to prevent duplicates upon retries
   */
  generateDeterministicId(
    recipientId: string,
    type: NotificationType,
    entityId: string,
    action: string = 'create'
  ): string {
    const cleanRecipient = getCanonicalEmployeeId(recipientId) || recipientId.toLowerCase();
    const cleanEntity = entityId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `notif_${cleanRecipient}_${type}_${cleanEntity}_${action}`.toLowerCase();
  }

  /**
   * Dispatch a notification to Firestore.
   * Atomic and idempotent via deterministic ID.
   */
  async dispatchNotification(params: {
    recipientId: string; // canonical employeeId, 'director', or 'all'
    recipientRole: 'director' | 'staff' | 'all';
    senderId: string;
    senderName: string;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    link?: string;
    entityId?: string;
    action?: string;
    metadata?: Record<string, any>;
  }): Promise<AppNotification> {
    const nowIso = new Date().toISOString();
    const entityId = params.entityId || `gen_${Date.now()}`;
    const id = this.generateDeterministicId(
      params.recipientId,
      params.type,
      entityId,
      params.action || 'event'
    );

    const notification: AppNotification = {
      id,
      recipientId: params.recipientId === 'director' || params.recipientId === 'all'
        ? params.recipientId
        : getCanonicalEmployeeId(params.recipientId) || params.recipientId,
      recipientRole: params.recipientRole,
      senderId: params.senderId,
      senderName: params.senderName,
      title: params.title,
      message: params.message,
      type: params.type,
      priority: params.priority || 'normal',
      link: params.link,
      read: false,
      readAt: null,
      createdAt: nowIso,
      dedupKey: `${params.recipientId}_${params.type}_${entityId}`,
      metadata: params.metadata || {},
    };

    const docRef = doc(db, 'notifications', id);
    const sanitized = sanitizeFirestorePayload({
      ...notification,
      updatedAt: nowIso,
    });

    try {
      await setDoc(docRef, sanitized, { merge: true });
    } catch (err: any) {
      console.warn('Failed to save notification to Firestore:', err?.message || err);
    }

    // Broadcast over WebSocket if connected
    try {
      websocketNotificationService.broadcastNotification(notification);
    } catch (e) {
      // Non-blocking
    }

    return notification;
  }

  /**
   * Subscribe to real-time notifications for the authenticated user.
   * Filters in-memory to ensure zero missing index errors in Firestore.
   */
  subscribeNotifications(
    role: 'admin' | 'staff',
    employeeId: string | undefined,
    callback: (notifications: AppNotification[]) => void
  ): () => void {
    const colRef = collection(db, 'notifications');
    const canonicalEmpId = employeeId ? getCanonicalEmployeeId(employeeId) || employeeId : '';

    // Simple, reliable query that does not require compound composite indexes
    let q;
    if (role === 'admin') {
      q = query(colRef, where('recipientRole', 'in', ['director', 'all']));
    } else if (canonicalEmpId) {
      q = query(colRef, where('recipientId', 'in', [canonicalEmpId, 'all']));
    } else {
      q = query(colRef, where('recipientRole', '==', 'all'));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const items: AppNotification[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as AppNotification;
          items.push({
            ...data,
            id: d.id,
          });
        });

        // Client-side sort: newest first
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Trigger browser notification for fresh incoming notifications (created within last 60s)
        const cutoffTime = this.lastNotifiedTimestamp - 10000;
        items.forEach((item) => {
          const itemTime = new Date(item.createdAt).getTime();
          if (!item.read && itemTime > cutoffTime && itemTime <= Date.now()) {
            this.showBrowserNotification(item);
          }
        });

        this.lastNotifiedTimestamp = Date.now();
        callback(items);
      },
      (error) => {
        console.warn('Error in notifications real-time subscription:', error?.message || error);
        // Fallback: report empty if collection doesn't exist yet
        callback([]);
      }
    );
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, {
        read: true,
        readAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Could not mark notification as read:', err?.message || err);
    }
  }

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(notificationsOrIds: (AppNotification | string)[]): Promise<void> {
    if (!notificationsOrIds || notificationsOrIds.length === 0) return;

    try {
      const batch = writeBatch(db);
      const readAt = new Date().toISOString();
      const ids = notificationsOrIds
        .map((item) => (typeof item === 'string' ? item : item.id))
        .filter(Boolean);

      ids.slice(0, 400).forEach((id) => {
        const ref = doc(db, 'notifications', id);
        batch.update(ref, { read: true, readAt });
      });
      await batch.commit();
    } catch (err: any) {
      console.warn('Could not mark all notifications as read:', err?.message || err);
    }
  }

  /**
   * Delete / dismiss a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.warn('Could not delete notification:', err?.message || err);
    }
  }
}

export const notificationService = new NotificationService();
