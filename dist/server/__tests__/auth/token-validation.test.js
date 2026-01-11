"use strict";
/**
 * Property-Based Test for JWT Token Validation
 *
 * Feature: coastal-hazards-merge, Property 15: JWT Token Validation
 *
 * Property: For any request to a protected endpoint with an invalid, expired,
 * or missing JWT token, the API SHALL return a 401 Unauthorized response.
 *
 * **Validates: Requirements 10.5**
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fc = __importStar(require("fast-check"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_service_1 = require("../../modules/auth/auth-service");
// Mock user for token generation
const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
};
// Helper to create mock request
function createMockRequest(authHeader) {
    return {
        headers: authHeader ? { authorization: authHeader } : {},
    };
}
// Helper to create mock response
function createMockResponse() {
    const res = {
        statusCode: undefined,
        jsonData: undefined,
    };
    res.status = ((code) => {
        res.statusCode = code;
        return res;
    });
    res.json = ((data) => {
        res.jsonData = data;
        return res;
    });
    return res;
}
describe('Property 15: JWT Token Validation', () => {
    // Feature: coastal-hazards-merge, Property 15: JWT Token Validation
    // **Validates: Requirements 10.5**
    describe('Missing Token', () => {
        it('should return 401 for requests without authorization header', async () => {
            await fc.assert(fc.asyncProperty(fc.record({
                path: fc.webPath(),
                method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
            }), async () => {
                const req = createMockRequest();
                const res = createMockResponse();
                let nextCalled = false;
                const next = () => { nextCalled = true; };
                (0, auth_service_1.authMiddleware)(req, res, next);
                // Property: Missing token SHALL return 401 Unauthorized
                expect(res.statusCode).toBe(401);
                expect(res.jsonData?.success).toBe(false);
                expect(nextCalled).toBe(false);
                return true;
            }), { numRuns: 100 });
        });
        it('should return 401 for requests with empty authorization header', async () => {
            await fc.assert(fc.asyncProperty(fc.constantFrom('', ' ', '  '), async (emptyAuth) => {
                const req = createMockRequest(emptyAuth);
                const res = createMockResponse();
                let nextCalled = false;
                const next = () => { nextCalled = true; };
                (0, auth_service_1.authMiddleware)(req, res, next);
                // Property: Empty auth header SHALL return 401 Unauthorized
                expect(res.statusCode).toBe(401);
                expect(nextCalled).toBe(false);
                return true;
            }), { numRuns: 100 });
        });
    });
    describe('Invalid Token Format', () => {
        it('should return 401 for requests without Bearer prefix', async () => {
            await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 200 }), async (randomToken) => {
                // Ensure it doesn't start with 'Bearer '
                const authHeader = randomToken.startsWith('Bearer ')
                    ? randomToken.substring(7)
                    : randomToken;
                const req = createMockRequest(authHeader);
                const res = createMockResponse();
                let nextCalled = false;
                const next = () => { nextCalled = true; };
                (0, auth_service_1.authMiddleware)(req, res, next);
                // Property: Non-Bearer token SHALL return 401 Unauthorized
                expect(res.statusCode).toBe(401);
                expect(nextCalled).toBe(false);
                return true;
            }), { numRuns: 100 });
        });
        it('should return 401 for malformed JWT tokens', async () => {
            await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 500 }), async (randomString) => {
                // Skip if it happens to be a valid JWT format
                if (randomString.split('.').length === 3) {
                    return true;
                }
                const req = createMockRequest(`Bearer ${randomString}`);
                const res = createMockResponse();
                let nextCalled = false;
                const next = () => { nextCalled = true; };
                (0, auth_service_1.authMiddleware)(req, res, next);
                // Property: Malformed JWT SHALL return 401 Unauthorized
                expect(res.statusCode).toBe(401);
                expect(nextCalled).toBe(false);
                return true;
            }), { numRuns: 100 });
        });
    });
    describe('Invalid Token Signature', () => {
        it('should return 401 for tokens signed with wrong secret', async () => {
            await fc.assert(fc.asyncProperty(fc.record({
                userId: fc.uuid(),
                email: fc.emailAddress(),
                role: fc.constantFrom('user', 'admin', 'moderator'),
            }), fc.string({ minLength: 10, maxLength: 50 }), async (userData, wrongSecret) => {
                // Generate token with wrong secret
                const payload = {
                    userId: userData.userId,
                    email: userData.email,
                    role: userData.role,
                    type: 'access',
                };
                const invalidToken = jsonwebtoken_1.default.sign(payload, wrongSecret, { expiresIn: '1h' });
                const req = createMockRequest(`Bearer ${invalidToken}`);
                const res = createMockResponse();
                let nextCalled = false;
                const next = () => { nextCalled = true; };
                (0, auth_service_1.authMiddleware)(req, res, next);
                // Property: Token with wrong signature SHALL return 401 Unauthorized
                expect(res.statusCode).toBe(401);
                expect(nextCalled).toBe(false);
                return true;
            }), { numRuns: 100 });
        });
        it('should return null from verifyToken for tampered tokens', async () => {
            await fc.assert(fc.asyncProperty(fc.record({
                userId: fc.uuid(),
                email: fc.emailAddress(),
                role: fc.constantFrom('user', 'admin', 'moderator'),
            }), async (userData) => {
                // Generate valid token
                const validToken = (0, auth_service_1.generateAccessToken)({
                    id: userData.userId,
                    email: userData.email,
                    role: userData.role,
                });
                // Tamper with the token by modifying a character
                const parts = validToken.split('.');
                if (parts.length === 3 && parts[2].length > 0) {
                    const lastChar = parts[2][parts[2].length - 1];
                    const newChar = lastChar === 'a' ? 'b' : 'a';
                    parts[2] = parts[2].slice(0, -1) + newChar;
                }
                const tamperedToken = parts.join('.');
                // Property: Tampered token SHALL return null from verifyToken
                const result = (0, auth_service_1.verifyToken)(tamperedToken);
                expect(result).toBeNull();
                return true;
            }), { numRuns: 100 });
        });
    });
    describe('Expired Token', () => {
        it('should return 401 for expired tokens', async () => {
            await fc.assert(fc.asyncProperty(fc.record({
                userId: fc.uuid(),
                email: fc.emailAddress(),
                role: fc.constantFrom('user', 'admin', 'moderator'),
            }), async (userData) => {
                // Generate token that expires immediately
                const payload = {
                    userId: userData.userId,
                    email: userData.email,
                    role: userData.role,
                    type: 'access',
                };
                const expiredToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'coastal-hazard-secret-key-change-in-production', { expiresIn: '-1s' } // Already expired
                );
                const req = createMockRequest(`Bearer ${expiredToken}`);
                const res = createMockResponse();
                let nextCalled = false;
                const next = () => { nextCalled = true; };
                (0, auth_service_1.authMiddleware)(req, res, next);
                // Property: Expired token SHALL return 401 Unauthorized
                expect(res.statusCode).toBe(401);
                expect(nextCalled).toBe(false);
                return true;
            }), { numRuns: 100 });
        });
        it('should return null from verifyToken for expired tokens', async () => {
            await fc.assert(fc.asyncProperty(fc.record({
                userId: fc.uuid(),
                email: fc.emailAddress(),
                role: fc.constantFrom('user', 'admin', 'moderator'),
            }), async (userData) => {
                const payload = {
                    userId: userData.userId,
                    email: userData.email,
                    role: userData.role,
                    type: 'access',
                };
                const expiredToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'coastal-hazard-secret-key-change-in-production', { expiresIn: '-1s' });
                // Property: Expired token SHALL return null from verifyToken
                const result = (0, auth_service_1.verifyToken)(expiredToken);
                expect(result).toBeNull();
                return true;
            }), { numRuns: 100 });
        });
    });
    describe('Wrong Token Type', () => {
        it('should return 401 when using refresh token as access token', async () => {
            await fc.assert(fc.asyncProperty(fc.record({
                userId: fc.uuid(),
                email: fc.emailAddress(),
                role: fc.constantFrom('user', 'admin', 'moderator'),
            }), async (userData) => {
                // Generate refresh token (not access token)
                const refreshToken = (0, auth_service_1.generateRefreshToken)({
                    id: userData.userId,
                    email: userData.email,
                    role: userData.role,
                });
                const req = createMockRequest(`Bearer ${refreshToken}`);
                const res = createMockResponse();
                let nextCalled = false;
                const next = () => { nextCalled = true; };
                (0, auth_service_1.authMiddleware)(req, res, next);
                // Property: Refresh token used as access token SHALL return 401
                expect(res.statusCode).toBe(401);
                expect(res.jsonData?.error?.message).toBe('Invalid token type');
                expect(nextCalled).toBe(false);
                return true;
            }), { numRuns: 100 });
        });
    });
    describe('Valid Token', () => {
        it('should allow valid access tokens and call next()', async () => {
            await fc.assert(fc.asyncProperty(fc.record({
                userId: fc.uuid(),
                email: fc.emailAddress(),
                role: fc.constantFrom('user', 'admin', 'moderator'),
            }), async (userData) => {
                // Generate valid access token
                const validToken = (0, auth_service_1.generateAccessToken)({
                    id: userData.userId,
                    email: userData.email,
                    role: userData.role,
                });
                const req = createMockRequest(`Bearer ${validToken}`);
                const res = createMockResponse();
                let nextCalled = false;
                const next = () => { nextCalled = true; };
                (0, auth_service_1.authMiddleware)(req, res, next);
                // Property: Valid access token SHALL call next() and attach user
                expect(nextCalled).toBe(true);
                expect(res.statusCode).toBeUndefined();
                expect(req.user).toBeDefined();
                expect(req.user?.userId).toBe(userData.userId);
                expect(req.user?.email).toBe(userData.email);
                expect(req.user?.role).toBe(userData.role);
                expect(req.user?.type).toBe('access');
                return true;
            }), { numRuns: 100 });
        });
        it('should correctly decode valid tokens with verifyToken', async () => {
            await fc.assert(fc.asyncProperty(fc.record({
                userId: fc.uuid(),
                email: fc.emailAddress(),
                role: fc.constantFrom('user', 'admin', 'moderator'),
            }), async (userData) => {
                const validToken = (0, auth_service_1.generateAccessToken)({
                    id: userData.userId,
                    email: userData.email,
                    role: userData.role,
                });
                // Property: Valid token SHALL be decoded correctly
                const decoded = (0, auth_service_1.verifyToken)(validToken);
                expect(decoded).not.toBeNull();
                expect(decoded?.userId).toBe(userData.userId);
                expect(decoded?.email).toBe(userData.email);
                expect(decoded?.role).toBe(userData.role);
                expect(decoded?.type).toBe('access');
                return true;
            }), { numRuns: 100 });
        });
    });
});
//# sourceMappingURL=token-validation.test.js.map