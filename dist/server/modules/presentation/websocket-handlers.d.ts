/**
 * WebSocket Handlers
 *
 * Real-time communication for alerts and reports.
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */
import { Server } from 'socket.io';
import { Alert } from '../../../shared/types/alert';
import { Report } from '../../../shared/types/report';
export type WebSocketEvent = 'alert_created' | 'alert_updated' | 'alert_resolved' | 'report_submitted' | 'report_verified' | 'system_notification';
export interface WebSocketMessage<T = unknown> {
    event: WebSocketEvent;
    data: T;
    timestamp: Date;
    region?: string;
}
export type RoomType = 'region' | 'hazard' | 'global';
/**
 * Initialize WebSocket handlers
 */
export declare function initializeWebSocket(io: Server): void;
/**
 * Broadcast alert to relevant rooms
 */
export declare function broadcastAlert(io: Server, alert: Alert, event: 'alert_created' | 'alert_updated' | 'alert_resolved'): void;
/**
 * Broadcast report submission
 */
export declare function broadcastReport(io: Server, report: Report, event: 'report_submitted' | 'report_verified'): void;
/**
 * Send notification to specific user
 */
export declare function notifyUser(io: Server, userId: string, notification: {
    title: string;
    message: string;
    type: string;
}): void;
/**
 * Broadcast system notification to all clients
 */
export declare function broadcastSystemNotification(io: Server, notification: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
}): void;
/**
 * Get connection statistics
 */
export declare function getConnectionStats(): {
    totalConnections: number;
    authenticatedUsers: number;
    regionSubscriptions: Record<string, number>;
    hazardSubscriptions: Record<string, number>;
};
/**
 * Disconnect all clients (for graceful shutdown)
 */
export declare function disconnectAllClients(io: Server): void;
export declare const websocketHandlers: {
    initializeWebSocket: typeof initializeWebSocket;
    broadcastAlert: typeof broadcastAlert;
    broadcastReport: typeof broadcastReport;
    notifyUser: typeof notifyUser;
    broadcastSystemNotification: typeof broadcastSystemNotification;
    getConnectionStats: typeof getConnectionStats;
    disconnectAllClients: typeof disconnectAllClients;
};
export default websocketHandlers;
//# sourceMappingURL=websocket-handlers.d.ts.map