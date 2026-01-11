import { Request, Response, NextFunction } from 'express';
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}
export declare const apiRateLimiter: RateLimitConfig;
export declare const reportSubmitRateLimiter: RateLimitConfig;
export declare function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function sanitizationMiddleware(req: Request, _res: Response, next: NextFunction): void;
export declare function rateLimitMiddleware(config: RateLimitConfig): (req: Request, res: Response, next: NextFunction) => void;
export declare function notFoundMiddleware(req: Request, res: Response): void;
export declare function errorHandlerMiddleware(err: Error & {
    statusCode?: number;
    code?: string;
}, req: Request, res: Response, _next: NextFunction): void;
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode?: number, code?: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
declare const _default: {
    requestIdMiddleware: typeof requestIdMiddleware;
    sanitizationMiddleware: typeof sanitizationMiddleware;
    rateLimitMiddleware: typeof rateLimitMiddleware;
    notFoundMiddleware: typeof notFoundMiddleware;
    errorHandlerMiddleware: typeof errorHandlerMiddleware;
    apiRateLimiter: RateLimitConfig;
    reportSubmitRateLimiter: RateLimitConfig;
    AppError: typeof AppError;
    ValidationError: typeof ValidationError;
    NotFoundError: typeof NotFoundError;
    UnauthorizedError: typeof UnauthorizedError;
    ForbiddenError: typeof ForbiddenError;
};
export default _default;
//# sourceMappingURL=error-handling.d.ts.map