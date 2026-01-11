/**
 * WebSocket Client Service
 * Provides Socket.IO client with connection management, event listeners, and reconnection logic
 * Requirements: 11.4
 */

import { io, Socket } from 'socket.io-client';
import { Alert } from '../shared/types/alert';
import { Report } from '../shared/types/report';

// Configuration
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;
const RECONNECTION_DELAY_MAX = 30000;

// Event types matching server-side definitions
export type WebSocketEvent =
  | 'alert_created'
  | 'alert_updated'
  | 'alert_resolved'
  | 'report_submitted'
  | 'report_verified'
  | 'system_notification';

export interface WebSocketMessage<T = unknown> {
  event: WebSocketEvent;
  data: T;
  timestamp: Date;
  region?: string;
}

export interface SystemNotification {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
}

export interface UserNotification {
  title: string;
  message: string;
  type: string;
  timestamp: string;
}

// Connection state
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// Event listener types
type AlertEventHandler = (message: WebSocketMessage<Alert>) => void;
type ReportEventHandler = (message: WebSocketMessage<Report>) => void;
type SystemNotificationHandler = (message: WebSocketMessage<SystemNotification>) => void;
type UserNotificationHandler = (notification: UserNotification) => void;
type ConnectionStateHandler = (state: ConnectionState) => void;
type ErrorHandler = (error: { message: string }) => void;

interface EventListeners {
  alert_created: Set<AlertEventHandler>;
  alert_updated: Set<AlertEventHandler>;
  alert_resolved: Set<AlertEventHandler>;
  report_submitted: Set<ReportEventHandler>;
  report_verified: Set<ReportEventHandler>;
  system_notification: Set<SystemNotificationHandler>;
  notification: Set<UserNotificationHandler>;
  connectionState: Set<ConnectionStateHandler>;
  error: Set<ErrorHandler>;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private subscribedRegions: Set<string> = new Set();
  private subscribedHazards: Set<string> = new Set();
  private userId: string | null = null;
  private listeners: EventListeners = {
    alert_created: new Set(),
    alert_updated: new Set(),
    alert_resolved: new Set(),
    report_submitted: new Set(),
    report_verified: new Set(),
    system_notification: new Set(),
    notification: new Set(),
    connectionState: new Set(),
    error: new Set(),
  };

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.setConnectionState('connecting');

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY,
      reconnectionDelayMax: RECONNECTION_DELAY_MAX,
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.setConnectionState('disconnected');
    this.subscribedRegions.clear();
    this.subscribedHazards.clear();
    this.userId = null;
  }

  /**
   * Set up socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.setConnectionState('connected');
      // Re-subscribe to previously subscribed rooms
      this.resubscribe();
    });

    this.socket.on('disconnect', () => {
      this.setConnectionState('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      this.notifyError({ message: error.message });
    });

    this.socket.io.on('reconnect_attempt', () => {
      this.setConnectionState('reconnecting');
    });

    this.socket.io.on('reconnect', () => {
      this.setConnectionState('connected');
      this.resubscribe();
    });

    this.socket.io.on('reconnect_failed', () => {
      this.setConnectionState('disconnected');
      this.notifyError({ message: 'Failed to reconnect after multiple attempts' });
    });

    // Alert events
    this.socket.on('alert_created', (message: WebSocketMessage<Alert>) => {
      this.listeners.alert_created.forEach(handler => handler(message));
    });

    this.socket.on('alert_updated', (message: WebSocketMessage<Alert>) => {
      this.listeners.alert_updated.forEach(handler => handler(message));
    });

    this.socket.on('alert_resolved', (message: WebSocketMessage<Alert>) => {
      this.listeners.alert_resolved.forEach(handler => handler(message));
    });

    // Report events
    this.socket.on('report_submitted', (message: WebSocketMessage<Report>) => {
      this.listeners.report_submitted.forEach(handler => handler(message));
    });

    this.socket.on('report_verified', (message: WebSocketMessage<Report>) => {
      this.listeners.report_verified.forEach(handler => handler(message));
    });

    // System notification
    this.socket.on('system_notification', (message: WebSocketMessage<SystemNotification>) => {
      this.listeners.system_notification.forEach(handler => handler(message));
    });

    // User notification
    this.socket.on('notification', (notification: UserNotification) => {
      this.listeners.notification.forEach(handler => handler(notification));
    });

    // Subscription confirmations
    this.socket.on('subscribed', (data: { type: string; id: string }) => {
      console.log(`Subscribed to ${data.type}: ${data.id}`);
    });

    this.socket.on('unsubscribed', (data: { type: string; id: string }) => {
      console.log(`Unsubscribed from ${data.type}: ${data.id}`);
    });

    // Error handling
    this.socket.on('error', (error: { message: string }) => {
      this.notifyError(error);
    });

    // Server shutdown
    this.socket.on('server_shutdown', () => {
      this.notifyError({ message: 'Server is shutting down' });
    });

    // Pong response
    this.socket.on('pong', (data: { timestamp: string }) => {
      console.log('Pong received:', data.timestamp);
    });
  }

  /**
   * Re-subscribe to rooms after reconnection
   */
  private resubscribe(): void {
    // Re-authenticate if we had a user
    if (this.userId) {
      this.authenticate(this.userId);
    }

    // Re-subscribe to regions
    this.subscribedRegions.forEach(region => {
      this.socket?.emit('subscribe_region', region);
    });

    // Re-subscribe to hazard types
    this.subscribedHazards.forEach(hazard => {
      this.socket?.emit('subscribe_hazard', hazard);
    });
  }

  /**
   * Update connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.listeners.connectionState.forEach(handler => handler(state));
  }

  /**
   * Notify error listeners
   */
  private notifyError(error: { message: string }): void {
    this.listeners.error.forEach(handler => handler(error));
  }

  /**
   * Subscribe to a region for filtered updates
   */
  subscribeToRegion(regionId: string): void {
    if (!this.socket?.connected) {
      this.subscribedRegions.add(regionId);
      return;
    }

    this.socket.emit('subscribe_region', regionId);
    this.subscribedRegions.add(regionId);
  }

  /**
   * Unsubscribe from a region
   */
  unsubscribeFromRegion(regionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_region', regionId);
    }
    this.subscribedRegions.delete(regionId);
  }

  /**
   * Subscribe to a hazard type for filtered updates
   */
  subscribeToHazard(hazardType: string): void {
    if (!this.socket?.connected) {
      this.subscribedHazards.add(hazardType);
      return;
    }

    this.socket.emit('subscribe_hazard', hazardType);
    this.subscribedHazards.add(hazardType);
  }

  /**
   * Unsubscribe from a hazard type
   */
  unsubscribeFromHazard(hazardType: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_hazard', hazardType);
    }
    this.subscribedHazards.delete(hazardType);
  }

  /**
   * Authenticate the WebSocket connection with a user ID
   */
  authenticate(userId: string): void {
    this.userId = userId;
    if (this.socket?.connected) {
      this.socket.emit('authenticate', userId);
    }
  }

  /**
   * Send a ping to check connection health
   */
  ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Get subscribed regions
   */
  getSubscribedRegions(): string[] {
    return Array.from(this.subscribedRegions);
  }

  /**
   * Get subscribed hazard types
   */
  getSubscribedHazards(): string[] {
    return Array.from(this.subscribedHazards);
  }

  // ============================================================================
  // Event Listener Management
  // ============================================================================

  /**
   * Add listener for alert created events
   */
  onAlertCreated(handler: AlertEventHandler): () => void {
    this.listeners.alert_created.add(handler);
    return () => this.listeners.alert_created.delete(handler);
  }

  /**
   * Add listener for alert updated events
   */
  onAlertUpdated(handler: AlertEventHandler): () => void {
    this.listeners.alert_updated.add(handler);
    return () => this.listeners.alert_updated.delete(handler);
  }

  /**
   * Add listener for alert resolved events
   */
  onAlertResolved(handler: AlertEventHandler): () => void {
    this.listeners.alert_resolved.add(handler);
    return () => this.listeners.alert_resolved.delete(handler);
  }

  /**
   * Add listener for report submitted events
   */
  onReportSubmitted(handler: ReportEventHandler): () => void {
    this.listeners.report_submitted.add(handler);
    return () => this.listeners.report_submitted.delete(handler);
  }

  /**
   * Add listener for report verified events
   */
  onReportVerified(handler: ReportEventHandler): () => void {
    this.listeners.report_verified.add(handler);
    return () => this.listeners.report_verified.delete(handler);
  }

  /**
   * Add listener for system notifications
   */
  onSystemNotification(handler: SystemNotificationHandler): () => void {
    this.listeners.system_notification.add(handler);
    return () => this.listeners.system_notification.delete(handler);
  }

  /**
   * Add listener for user notifications
   */
  onUserNotification(handler: UserNotificationHandler): () => void {
    this.listeners.notification.add(handler);
    return () => this.listeners.notification.delete(handler);
  }

  /**
   * Add listener for connection state changes
   */
  onConnectionStateChange(handler: ConnectionStateHandler): () => void {
    this.listeners.connectionState.add(handler);
    return () => this.listeners.connectionState.delete(handler);
  }

  /**
   * Add listener for errors
   */
  onError(handler: ErrorHandler): () => void {
    this.listeners.error.add(handler);
    return () => this.listeners.error.delete(handler);
  }

  /**
   * Add listener for any alert event (created, updated, resolved)
   */
  onAnyAlertEvent(handler: AlertEventHandler): () => void {
    this.listeners.alert_created.add(handler);
    this.listeners.alert_updated.add(handler);
    this.listeners.alert_resolved.add(handler);
    return () => {
      this.listeners.alert_created.delete(handler);
      this.listeners.alert_updated.delete(handler);
      this.listeners.alert_resolved.delete(handler);
    };
  }

  /**
   * Add listener for any report event (submitted, verified)
   */
  onAnyReportEvent(handler: ReportEventHandler): () => void {
    this.listeners.report_submitted.add(handler);
    this.listeners.report_verified.add(handler);
    return () => {
      this.listeners.report_submitted.delete(handler);
      this.listeners.report_verified.delete(handler);
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    Object.values(this.listeners).forEach(set => set.clear());
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

/**
 * Get the WebSocket client singleton
 */
export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
}

/**
 * Create a new WebSocket client (for testing or multiple connections)
 */
export function createWebSocketClient(): WebSocketClient {
  return new WebSocketClient();
}

// Export the singleton for convenience
export const websocket = {
  connect: () => getWebSocketClient().connect(),
  disconnect: () => getWebSocketClient().disconnect(),
  subscribeToRegion: (regionId: string) => getWebSocketClient().subscribeToRegion(regionId),
  unsubscribeFromRegion: (regionId: string) => getWebSocketClient().unsubscribeFromRegion(regionId),
  subscribeToHazard: (hazardType: string) => getWebSocketClient().subscribeToHazard(hazardType),
  unsubscribeFromHazard: (hazardType: string) => getWebSocketClient().unsubscribeFromHazard(hazardType),
  authenticate: (userId: string) => getWebSocketClient().authenticate(userId),
  ping: () => getWebSocketClient().ping(),
  getConnectionState: () => getWebSocketClient().getConnectionState(),
  isConnected: () => getWebSocketClient().isConnected(),
  getSubscribedRegions: () => getWebSocketClient().getSubscribedRegions(),
  getSubscribedHazards: () => getWebSocketClient().getSubscribedHazards(),
  onAlertCreated: (handler: AlertEventHandler) => getWebSocketClient().onAlertCreated(handler),
  onAlertUpdated: (handler: AlertEventHandler) => getWebSocketClient().onAlertUpdated(handler),
  onAlertResolved: (handler: AlertEventHandler) => getWebSocketClient().onAlertResolved(handler),
  onReportSubmitted: (handler: ReportEventHandler) => getWebSocketClient().onReportSubmitted(handler),
  onReportVerified: (handler: ReportEventHandler) => getWebSocketClient().onReportVerified(handler),
  onSystemNotification: (handler: SystemNotificationHandler) => getWebSocketClient().onSystemNotification(handler),
  onUserNotification: (handler: UserNotificationHandler) => getWebSocketClient().onUserNotification(handler),
  onConnectionStateChange: (handler: ConnectionStateHandler) => getWebSocketClient().onConnectionStateChange(handler),
  onError: (handler: ErrorHandler) => getWebSocketClient().onError(handler),
  onAnyAlertEvent: (handler: AlertEventHandler) => getWebSocketClient().onAnyAlertEvent(handler),
  onAnyReportEvent: (handler: ReportEventHandler) => getWebSocketClient().onAnyReportEvent(handler),
  removeAllListeners: () => getWebSocketClient().removeAllListeners(),
};

export default websocket;
