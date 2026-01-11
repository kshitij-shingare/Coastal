"use strict";
/**
 * WebSocket Handlers
 *
 * Real-time communication for alerts and reports.
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketHandlers = void 0;
exports.initializeWebSocket = initializeWebSocket;
exports.broadcastAlert = broadcastAlert;
exports.broadcastReport = broadcastReport;
exports.notifyUser = notifyUser;
exports.broadcastSystemNotification = broadcastSystemNotification;
exports.getConnectionStats = getConnectionStats;
exports.disconnectAllClients = disconnectAllClients;
const logger_1 = require("../../utils/logger");
// Connected clients tracking
const connectedClients = new Map();
/**
 * Initialize WebSocket handlers
 */
function initializeWebSocket(io) {
    io.on('connection', (socket) => {
        logger_1.logger.info(`WebSocket client connected: ${socket.id}`);
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
        socket.on('subscribe_region', (regionId) => {
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
            logger_1.logger.debug(`Client ${socket.id} subscribed to region: ${regionId}`);
            socket.emit('subscribed', { type: 'region', id: regionId });
        });
        // Handle region unsubscription
        socket.on('unsubscribe_region', (regionId) => {
            const roomName = `region:${regionId}`;
            socket.leave(roomName);
            const client = connectedClients.get(socket.id);
            if (client) {
                client.subscribedRegions.delete(regionId);
            }
            logger_1.logger.debug(`Client ${socket.id} unsubscribed from region: ${regionId}`);
            socket.emit('unsubscribed', { type: 'region', id: regionId });
        });
        // Handle hazard type subscription
        socket.on('subscribe_hazard', (hazardType) => {
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
            logger_1.logger.debug(`Client ${socket.id} subscribed to hazard: ${hazardType}`);
            socket.emit('subscribed', { type: 'hazard', id: hazardType });
        });
        // Handle hazard type unsubscription
        socket.on('unsubscribe_hazard', (hazardType) => {
            const roomName = `hazard:${hazardType}`;
            socket.leave(roomName);
            const client = connectedClients.get(socket.id);
            if (client) {
                client.subscribedHazards.delete(hazardType);
            }
            logger_1.logger.debug(`Client ${socket.id} unsubscribed from hazard: ${hazardType}`);
            socket.emit('unsubscribed', { type: 'hazard', id: hazardType });
        });
        // Handle user authentication
        socket.on('authenticate', (userId) => {
            const client = connectedClients.get(socket.id);
            if (client) {
                client.userId = userId;
                socket.join(`user:${userId}`);
                logger_1.logger.debug(`Client ${socket.id} authenticated as user: ${userId}`);
            }
        });
        // Handle ping for connection health
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date().toISOString() });
        });
        // Handle disconnection
        socket.on('disconnect', (reason) => {
            connectedClients.delete(socket.id);
            logger_1.logger.info(`WebSocket client disconnected: ${socket.id}, reason: ${reason}`);
        });
        // Handle errors
        socket.on('error', (error) => {
            logger_1.logger.error(`WebSocket error for client ${socket.id}:`, error);
        });
    });
    logger_1.logger.info('WebSocket handlers initialized');
}
/**
 * Broadcast alert to relevant rooms
 */
function broadcastAlert(io, alert, event) {
    const message = {
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
    logger_1.logger.debug(`Broadcasted ${event} to relevant rooms`, {
        alertId: alert.id,
        region: alert.region?.name,
        hazardType: alert.hazardType,
    });
}
/**
 * Broadcast report submission
 */
function broadcastReport(io, report, event) {
    const message = {
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
    logger_1.logger.debug(`Broadcasted ${event}`, {
        reportId: report.id,
        region: report.region,
    });
}
/**
 * Send notification to specific user
 */
function notifyUser(io, userId, notification) {
    io.to(`user:${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString(),
    });
}
/**
 * Broadcast system notification to all clients
 */
function broadcastSystemNotification(io, notification) {
    const message = {
        event: 'system_notification',
        data: notification,
        timestamp: new Date(),
    };
    io.to('global').emit('system_notification', message);
    logger_1.logger.info('System notification broadcasted', notification);
}
/**
 * Get connection statistics
 */
function getConnectionStats() {
    const regionCounts = {};
    const hazardCounts = {};
    let authenticatedCount = 0;
    for (const client of connectedClients.values()) {
        if (client.userId)
            authenticatedCount++;
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
function disconnectAllClients(io) {
    io.emit('server_shutdown', { message: 'Server is shutting down' });
    io.disconnectSockets(true);
    connectedClients.clear();
    logger_1.logger.info('All WebSocket clients disconnected');
}
exports.websocketHandlers = {
    initializeWebSocket,
    broadcastAlert,
    broadcastReport,
    notifyUser,
    broadcastSystemNotification,
    getConnectionStats,
    disconnectAllClients,
};
exports.default = exports.websocketHandlers;
//# sourceMappingURL=websocket-handlers.js.map