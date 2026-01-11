/**
 * WebSocket Handlers
 * 
 * Real-time communication for alerts and reports.
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { Alert } from '../../../shared/types/alert';
import { Report } from '../../../shared/types/report';

// Event types
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

// Room types
export type RoomType = 'region' | 'hazard' | 'global';

// Connected clients tracking
const connectedClients = new Map<string, {
  socketId: string;
  userId?: string;
  subscribedRegions: Set<string>;
  subscribedHazards: Set<string>;
  connectedAt: Date;
}>();

/**
 * Initialize WebSocket handlers
 */
export function initializeWebSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Track client
    connectedClients.set(socket.id, {
      socketId: socket.id,
      subscribedRegions: new Set(),
      subscribedHazards: new Set(),
      connectedAt: new Date(),
    });

    // Join global room
    socket.join('global');

    // Handle region subscription
    socket.on('subscribe_region', (regionId: string) => {
      if (!regionId || typeof regionId !== 'string') {
        socket.emit('error', { message: 'Invalid region ID' });
        return;
      }

      const roomName = `region:${regionId}`;
      socket.join(roomName);
      
      const client = connectedClients.get(socket.id);
      if (client) {
        client.subscribedRegions.add(regionId);
      }

      logger.debug(`Client ${socket.id} subscribed to region: ${regionId}`);
      socket.emit('subscribed', { type: 'region', id: regionId });
    });


    // Handle region unsubscription
    socket.on('unsubscribe_region', (regionId: string) => {
      const roomName = `region:${regionId}`;
      socket.leave(roomName);
      
      const client = connectedClients.get(socket.id);
      if (client) {
        client.subscribedRegions.delete(regionId);
      }

      logger.debug(`Client ${socket.id} unsubscribed from region: ${regionId}`);
      socket.emit('unsubscribed', { type: 'region', id: regionId });
    });

    // Handle hazard type subscription
    socket.on('subscribe_hazard', (hazardType: string) => {
      if (!hazardType || typeof hazardType !== 'string') {
        socket.emit('error', { message: 'Invalid hazard type' });
        return;
      }

      const roomName = `hazard:${hazardType}`;
      socket.join(roomName);
      
      const client = connectedClients.get(socket.id);
      if (client) {
        client.subscribedHazards.add(hazardType);
      }

      logger.debug(`Client ${socket.id} subscribed to hazard: ${hazardType}`);
      socket.emit('subscribed', { type: 'hazard', id: hazardType });
    });

    // Handle hazard type unsubscription
    socket.on('unsubscribe_hazard', (hazardType: string) => {
      const roomName = `hazard:${hazardType}`;
      socket.leave(roomName);
      
      const client = connectedClients.get(socket.id);
      if (client) {
        client.subscribedHazards.delete(hazardType);
      }

      logger.debug(`Client ${socket.id} unsubscribed from hazard: ${hazardType}`);
      socket.emit('unsubscribed', { type: 'hazard', id: hazardType });
    });

    // Handle user authentication
    socket.on('authenticate', (userId: string) => {
      const client = connectedClients.get(socket.id);
      if (client) {
        client.userId = userId;
        socket.join(`user:${userId}`);
        logger.debug(`Client ${socket.id} authenticated as user: ${userId}`);
      }
    });

    // Handle ping for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      connectedClients.delete(socket.id);
      logger.info(`WebSocket client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for client ${socket.id}:`, error);
    });
  });

  logger.info('WebSocket handlers initialized');
}

/**
 * Broadcast alert to relevant rooms
 */
export function broadcastAlert(io: Server, alert: Alert, event: 'alert_created' | 'alert_updated' | 'alert_resolved'): void {
  const message: WebSocketMessage<Alert> = {
    event,
    data: alert,
    timestamp: new Date(),
    region: alert.region?.name,
  };

  // Broadcast to global room
  io.to('global').emit(event, message);

  // Broadcast to region-specific room
  if (alert.region?.name) {
    io.to(`region:${alert.region.name}`).emit(event, message);
  }

  // Broadcast to hazard-specific room
  io.to(`hazard:${alert.hazardType}`).emit(event, message);

  logger.debug(`Broadcasted ${event} to relevant rooms`, {
    alertId: alert.id,
    region: alert.region?.name,
    hazardType: alert.hazardType,
  });
}

/**
 * Broadcast report submission
 */
export function broadcastReport(io: Server, report: Report, event: 'report_submitted' | 'report_verified'): void {
  const message: WebSocketMessage<Report> = {
    event,
    data: report,
    timestamp: new Date(),
    region: report.region,
  };

  // Broadcast to global room
  io.to('global').emit(event, message);

  // Broadcast to region-specific room
  io.to(`region:${report.region}`).emit(event, message);

  // Broadcast to hazard-specific room if classified
  if (report.classification.hazardType) {
    io.to(`hazard:${report.classification.hazardType}`).emit(event, message);
  }

  logger.debug(`Broadcasted ${event}`, {
    reportId: report.id,
    region: report.region,
  });
}


/**
 * Send notification to specific user
 */
export function notifyUser(io: Server, userId: string, notification: { title: string; message: string; type: string }): void {
  io.to(`user:${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast system notification to all clients
 */
export function broadcastSystemNotification(io: Server, notification: { title: string; message: string; severity: 'info' | 'warning' | 'error' }): void {
  const message: WebSocketMessage<typeof notification> = {
    event: 'system_notification',
    data: notification,
    timestamp: new Date(),
  };

  io.to('global').emit('system_notification', message);
  logger.info('System notification broadcasted', notification);
}

/**
 * Get connection statistics
 */
export function getConnectionStats(): {
  totalConnections: number;
  authenticatedUsers: number;
  regionSubscriptions: Record<string, number>;
  hazardSubscriptions: Record<string, number>;
} {
  const regionCounts: Record<string, number> = {};
  const hazardCounts: Record<string, number> = {};
  let authenticatedCount = 0;

  for (const client of connectedClients.values()) {
    if (client.userId) authenticatedCount++;
    
    for (const region of client.subscribedRegions) {
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }
    
    for (const hazard of client.subscribedHazards) {
      hazardCounts[hazard] = (hazardCounts[hazard] || 0) + 1;
    }
  }

  return {
    totalConnections: connectedClients.size,
    authenticatedUsers: authenticatedCount,
    regionSubscriptions: regionCounts,
    hazardSubscriptions: hazardCounts,
  };
}

/**
 * Disconnect all clients (for graceful shutdown)
 */
export function disconnectAllClients(io: Server): void {
  io.emit('server_shutdown', { message: 'Server is shutting down' });
  io.disconnectSockets(true);
  connectedClients.clear();
  logger.info('All WebSocket clients disconnected');
}

export const websocketHandlers = {
  initializeWebSocket,
  broadcastAlert,
  broadcastReport,
  notifyUser,
  broadcastSystemNotification,
  getConnectionStats,
  disconnectAllClients,
};

export default websocketHandlers;
