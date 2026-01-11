"use strict";
// API type definitions - shared between frontend and backend
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.validatePaginationParams = validatePaginationParams;
// Helper functions
function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
}
function createErrorResponse(code, message, details) {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },
        timestamp: new Date().toISOString(),
    };
}
function validatePaginationParams(params) {
    const errors = [];
    if (params.page !== undefined && (params.page < 1 || !Number.isInteger(params.page))) {
        errors.push('Page must be a positive integer');
    }
    if (params.limit !== undefined && (params.limit < 1 || params.limit > 100 || !Number.isInteger(params.limit))) {
        errors.push('Limit must be an integer between 1 and 100');
    }
    if (params.sortOrder !== undefined && !['asc', 'desc'].includes(params.sortOrder)) {
        errors.push('Sort order must be "asc" or "desc"');
    }
    return errors;
}
//# sourceMappingURL=api.js.map