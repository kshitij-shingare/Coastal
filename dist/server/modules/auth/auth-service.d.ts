/**
 * Authentication Service
 *
 * Handles password hashing, JWT token generation, and validation.
 * Validates: Requirements 10.3, 10.4, 10.5
 */
import { Request, Response, NextFunction } from 'express';
export interface User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: 'user' | 'admin' | 'moderator';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    type: 'access' | 'refresh';
}
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}
/**
 * Hash a password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verify a password against a hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Generate access token
 */
export declare function generateAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string;
/**
 * Generate refresh token
 */
export declare function generateRefreshToken(user: Pick<User, 'id' | 'email' | 'role'>): string;
/**
 * Generate both access and refresh tokens
 */
export declare function generateTokenPair(user: Pick<User, 'id' | 'email' | 'role'>): {
    accessToken: string;
    refreshToken: string;
};
/**
 * Verify and decode a JWT token
 */
export declare function verifyToken(token: string): TokenPayload | null;
/**
 * Authentication middleware - requires valid access token
 */
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Optional authentication middleware - attaches user if token present
 */
export declare function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
/**
 * Role-based authorization middleware
 */
export declare function requireRole(...roles: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Validate password strength
 */
export declare function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
};
export declare const authService: {
    hashPassword: typeof hashPassword;
    verifyPassword: typeof verifyPassword;
    generateAccessToken: typeof generateAccessToken;
    generateRefreshToken: typeof generateRefreshToken;
    generateTokenPair: typeof generateTokenPair;
    verifyToken: typeof verifyToken;
    authMiddleware: typeof authMiddleware;
    optionalAuthMiddleware: typeof optionalAuthMiddleware;
    requireRole: typeof requireRole;
    validatePasswordStrength: typeof validatePasswordStrength;
};
export default authService;
//# sourceMappingURL=auth-service.d.ts.map