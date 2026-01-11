/**
 * Presentation Module Index
 * 
 * Exports all presentation layer components including API routes and WebSocket handlers.
 */

export { apiRouter, apiRoutesModule } from './api-routes';

export {
  initializeWebSocket,
  broadcastAlert,
  broadcastReport,
  notifyUser,
  broadcastSystemNotification,
  getConnectionStats,
  disconnectAllClients,
  websocketHandlers,
} from './websocket-handlers';

export type {
  WebSocketEvent,
  WebSocketMessage,
} from './websocket-handlers';
