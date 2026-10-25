// Robust WebSocket Client for Manshi Group Setu Real-time Notifications
// Supports auto-reconnect, heartbeat, auth handshake, and automatic fallback

import { AppNotification, WebSocketConnectionStatus } from '../types';

type NotificationListener = (notification: AppNotification) => void;
type StatusListener = (status: WebSocketConnectionStatus) => void;

class WebSocketNotificationService {
  private socket: WebSocket | null = null;
  private status: WebSocketConnectionStatus = 'fallback_realtime';
  private notificationListeners = new Set<NotificationListener>();
  private statusListeners = new Set<StatusListener>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: any = null;
  private heartbeatInterval: any = null;
  private currentAuthParams: { token?: string; uid?: string; role?: string; employeeId?: string } | null = null;
  private wsUrl: string;

  constructor() {
    // Check environment variable for optional standalone WebSocket server
    this.wsUrl = (import.meta.env.VITE_WS_NOTIFICATION_URL || '').trim();
    if (!this.wsUrl) {
      this.setStatus('fallback_realtime');
    }
  }

  /**
   * Current WebSocket connection status
   */
  getStatus(): WebSocketConnectionStatus {
    return this.status;
  }

  /**
   * Get configured WebSocket server URL (if any)
   */
  getWsUrl(): string {
    return this.wsUrl;
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Subscribe to live incoming WebSocket notification messages
   */
  onNotification(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  private setStatus(status: WebSocketConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((fn) => {
      try {
        fn(status);
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    });
  }

  /**
   * Connect to WebSocket server with authentication credentials
   */
  connect(authParams: { token?: string; uid?: string; role?: string; employeeId?: string }): void {
    this.currentAuthParams = authParams;

    // If no WebSocket URL is configured, operate directly in fallback_realtime mode
    if (!this.wsUrl) {
      this.setStatus('fallback_realtime');
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;

        // Send authentication handshake
        this.send({
          type: 'AUTH',
          ...this.currentAuthParams,
          timestamp: new Date().toISOString(),
        });

        // Start heartbeat ping
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PONG') {
            // Heartbeat response
            return;
          }
          if (data.type === 'NOTIFICATION' && data.payload) {
            this.notificationListeners.forEach((fn) => {
              try {
                fn(data.payload as AppNotification);
              } catch (err) {
                console.error('Error in notification listener:', err);
              }
            });
          }
        } catch (e) {
          console.warn('Failed to parse WebSocket message:', e);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        this.setStatus('error');
      };

      this.socket.onclose = (event) => {
        this.stopHeartbeat();
        this.socket = null;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.setStatus('disconnected');
          this.scheduleReconnect();
        } else {
          // If WebSocket max reconnect attempts exhausted, gracefully fall back to Firestore real-time engine
          this.setStatus('fallback_realtime');
        }
      };
    } catch (err) {
      console.warn('Could not establish WebSocket connection:', err);
      this.setStatus('fallback_realtime');
    }
  }

  /**
   * Schedule automatic reconnection with exponential backoff and jitter
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts++;

    // Exponential backoff: 1.5s, 3s, 6s, 12s, 24s + jitter
    const delay = Math.min(1500 * Math.pow(2, this.reconnectAttempts - 1), 24000) + Math.random() * 500;
    this.reconnectTimer = setTimeout(() => {
      if (this.currentAuthParams) {
        this.connect(this.currentAuthParams);
      }
    }, delay);
  }

  /**
   * Start 25s ping heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING', timestamp: Date.now() });
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send a JSON message over the WebSocket connection
   */
  send(message: Record<string, any>): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Broadcast a newly created notification over WebSocket if connected
   */
  broadcastNotification(notification: AppNotification): boolean {
    return this.send({
      type: 'BROADCAST',
      payload: notification,
      timestamp: Date.now(),
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }
}

export const websocketNotificationService = new WebSocketNotificationService();
