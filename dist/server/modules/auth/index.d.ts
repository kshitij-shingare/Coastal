/**
 * Authentication Module Index
 *
 * Exports authentication services and routes.
 */
export { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, generateTokenPair, verifyToken, authMiddleware, optionalAuthMiddleware, requireRole, validatePasswordStrength, authService, } from './auth-service';
export type { User, TokenPayload, AuthenticatedRequest, } from './auth-service';
export { authRouter, authRoutesModule } from './auth-routes';
//# sourceMappingURL=index.d.ts.map