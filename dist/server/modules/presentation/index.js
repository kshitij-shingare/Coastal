"use strict";
/**
 * Presentation Module Index
 *
 * Exports all presentation layer components including API routes and WebSocket handlers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketHandlers = exports.disconnectAllClients = exports.getConnectionStats = exports.broadcastSystemNotification = exports.notifyUser = exports.broadcastReport = exports.broadcastAlert = exports.initializeWebSocket = exports.apiRoutesModule = exports.apiRouter = void 0;
var api_routes_1 = require("./api-routes");
Object.defineProperty(exports, "apiRouter", { enumerable: true, get: function () { return api_routes_1.apiRouter; } });
Object.defineProperty(exports, "apiRoutesModule", { enumerable: true, get: function () { return api_routes_1.apiRoutesModule; } });
var websocket_handlers_1 = require("./websocket-handlers");
Object.defineProperty(exports, "initializeWebSocket", { enumerable: true, get: function () { return websocket_handlers_1.initializeWebSocket; } });
Object.defineProperty(exports, "broadcastAlert", { enumerable: true, get: function () { return websocket_handlers_1.broadcastAlert; } });
Object.defineProperty(exports, "broadcastReport", { enumerable: true, get: function () { return websocket_handlers_1.broadcastReport; } });
Object.defineProperty(exports, "notifyUser", { enumerable: true, get: function () { return websocket_handlers_1.notifyUser; } });
Object.defineProperty(exports, "broadcastSystemNotification", { enumerable: true, get: function () { return websocket_handlers_1.broadcastSystemNotification; } });
Object.defineProperty(exports, "getConnectionStats", { enumerable: true, get: function () { return websocket_handlers_1.getConnectionStats; } });
Object.defineProperty(exports, "disconnectAllClients", { enumerable: true, get: function () { return websocket_handlers_1.disconnectAllClients; } });
Object.defineProperty(exports, "websocketHandlers", { enumerable: true, get: function () { return websocket_handlers_1.websocketHandlers; } });
//# sourceMappingURL=index.js.map