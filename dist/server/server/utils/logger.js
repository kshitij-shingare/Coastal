"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogStream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const logDir = process.env.LOG_DIR || 'logs';
// Custom format for console output
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
}));
// Custom format for file output
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'coastal-hazard-intelligence' },
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: consoleFormat,
        }),
    ],
});
// Add file transports only in non-demo mode and when not in test
if (process.env.NODE_ENV !== 'test' && process.env.DEMO_MODE !== 'true') {
    // Error log file
    exports.logger.add(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
    // Combined log file
    exports.logger.add(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'combined.log'),
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
// Stream for Morgan HTTP logging
exports.httpLogStream = {
    write: (message) => {
        exports.logger.info(message.trim());
    },
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map