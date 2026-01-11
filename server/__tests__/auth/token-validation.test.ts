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

import * as fc from 'fast-check';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  authMiddleware,
  AuthenticatedRequest,
  TokenPayload,
} from '../../modules/auth/auth-service';

// Mock user for token generation
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'user' as const,
};

// Helper to create mock request
function createMockRequest(authHeader?: string): Partial<AuthenticatedRequest> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

// Helper to create mock response
function createMockResponse(): Partial<Response> & { statusCode?: number; jsonData?: unknown } {
  const res: Partial<Response> & { statusCode?: number; jsonData?: unknown } = {
    statusCode: undefined,
    jsonData: undefined,
  };
  res.status = ((code: number) => {
    res.statusCode = code;
    return res as Response;
  }) as Response['status'];
  res.json = ((data: unknown) => {
    res.jsonData = data;
    return res as Response;
  }) as Response['json'];
  return res;
}

describe('Property 15: JWT Token Validation', () => {
  // Feature: coastal-hazards-merge, Property 15: JWT Token Validation
  // **Validates: Requirements 10.5**

  describe('Missing Token', () => {
    it('should return 401 for requests without authorization header', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            path: fc.webPath(),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          }),
          async () => {
            const req = createMockRequest() as AuthenticatedRequest;
            const res = createMockResponse() as Response;
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            authMiddleware(req, res, next);

            // Property: Missing token SHALL return 401 Unauthorized
            expect((res as unknown as { statusCode: number }).statusCode).toBe(401);
            expect((res as unknown as { jsonData: { success: boolean } }).jsonData?.success).toBe(false);
            expect(nextCalled).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 401 for requests with empty authorization header', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', ' ', '  '),
          async (emptyAuth) => {
            const req = createMockRequest(emptyAuth) as AuthenticatedRequest;
            const res = createMockResponse() as Response;
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            authMiddleware(req, res, next);

            // Property: Empty auth header SHALL return 401 Unauthorized
            expect((res as unknown as { statusCode: number }).statusCode).toBe(401);
            expect(nextCalled).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid Token Format', () => {
    it('should return 401 for requests without Bearer prefix', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (randomToken) => {
            // Ensure it doesn't start with 'Bearer '
            const authHeader = randomToken.startsWith('Bearer ') 
              ? randomToken.substring(7) 
              : randomToken;
            
            const req = createMockRequest(authHeader) as AuthenticatedRequest;
            const res = createMockResponse() as Response;
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            authMiddleware(req, res, next);

            // Property: Non-Bearer token SHALL return 401 Unauthorized
            expect((res as unknown as { statusCode: number }).statusCode).toBe(401);
            expect(nextCalled).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 401 for malformed JWT tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }),
          async (randomString) => {
            // Skip if it happens to be a valid JWT format
            if (randomString.split('.').length === 3) {
              return true;
            }

            const req = createMockRequest(`Bearer ${randomString}`) as AuthenticatedRequest;
            const res = createMockResponse() as Response;
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            authMiddleware(req, res, next);

            // Property: Malformed JWT SHALL return 401 Unauthorized
            expect((res as unknown as { statusCode: number }).statusCode).toBe(401);
            expect(nextCalled).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid Token Signature', () => {
    it('should return 401 for tokens signed with wrong secret', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('user', 'admin', 'moderator'),
          }),
          fc.string({ minLength: 10, maxLength: 50 }),
          async (userData, wrongSecret) => {
            // Generate token with wrong secret
            const payload: TokenPayload = {
              userId: userData.userId,
              email: userData.email,
              role: userData.role,
              type: 'access',
            };
            const invalidToken = jwt.sign(payload, wrongSecret, { expiresIn: '1h' });

            const req = createMockRequest(`Bearer ${invalidToken}`) as AuthenticatedRequest;
            const res = createMockResponse() as Response;
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            authMiddleware(req, res, next);

            // Property: Token with wrong signature SHALL return 401 Unauthorized
            expect((res as unknown as { statusCode: number }).statusCode).toBe(401);
            expect(nextCalled).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null from verifyToken for tampered tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('user', 'admin', 'moderator'),
          }),
          async (userData) => {
            // Generate valid token
            const validToken = generateAccessToken({
              id: userData.userId,
              email: userData.email,
              role: userData.role as 'user' | 'admin' | 'moderator',
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
            const result = verifyToken(tamperedToken);
            expect(result).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Expired Token', () => {
    it('should return 401 for expired tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('user', 'admin', 'moderator'),
          }),
          async (userData) => {
            // Generate token that expires immediately
            const payload: TokenPayload = {
              userId: userData.userId,
              email: userData.email,
              role: userData.role,
              type: 'access',
            };
            const expiredToken = jwt.sign(
              payload,
              process.env.JWT_SECRET || 'coastal-hazard-secret-key-change-in-production',
              { expiresIn: '-1s' } // Already expired
            );

            const req = createMockRequest(`Bearer ${expiredToken}`) as AuthenticatedRequest;
            const res = createMockResponse() as Response;
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            authMiddleware(req, res, next);

            // Property: Expired token SHALL return 401 Unauthorized
            expect((res as unknown as { statusCode: number }).statusCode).toBe(401);
            expect(nextCalled).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null from verifyToken for expired tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('user', 'admin', 'moderator'),
          }),
          async (userData) => {
            const payload: TokenPayload = {
              userId: userData.userId,
              email: userData.email,
              role: userData.role,
              type: 'access',
            };
            const expiredToken = jwt.sign(
              payload,
              process.env.JWT_SECRET || 'coastal-hazard-secret-key-change-in-production',
              { expiresIn: '-1s' }
            );

            // Property: Expired token SHALL return null from verifyToken
            const result = verifyToken(expiredToken);
            expect(result).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Wrong Token Type', () => {
    it('should return 401 when using refresh token as access token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('user', 'admin', 'moderator'),
          }),
          async (userData) => {
            // Generate refresh token (not access token)
            const refreshToken = generateRefreshToken({
              id: userData.userId,
              email: userData.email,
              role: userData.role as 'user' | 'admin' | 'moderator',
            });

            const req = createMockRequest(`Bearer ${refreshToken}`) as AuthenticatedRequest;
            const res = createMockResponse() as Response;
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            authMiddleware(req, res, next);

            // Property: Refresh token used as access token SHALL return 401
            expect((res as unknown as { statusCode: number }).statusCode).toBe(401);
            expect((res as unknown as { jsonData: { error: { message: string } } }).jsonData?.error?.message).toBe('Invalid token type');
            expect(nextCalled).toBe(false);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Valid Token', () => {
    it('should allow valid access tokens and call next()', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('user', 'admin', 'moderator'),
          }),
          async (userData) => {
            // Generate valid access token
            const validToken = generateAccessToken({
              id: userData.userId,
              email: userData.email,
              role: userData.role as 'user' | 'admin' | 'moderator',
            });

            const req = createMockRequest(`Bearer ${validToken}`) as AuthenticatedRequest;
            const res = createMockResponse() as Response;
            let nextCalled = false;
            const next = () => { nextCalled = true; };

            authMiddleware(req, res, next);

            // Property: Valid access token SHALL call next() and attach user
            expect(nextCalled).toBe(true);
            expect((res as unknown as { statusCode: number }).statusCode).toBeUndefined();
            expect(req.user).toBeDefined();
            expect(req.user?.userId).toBe(userData.userId);
            expect(req.user?.email).toBe(userData.email);
            expect(req.user?.role).toBe(userData.role);
            expect(req.user?.type).toBe('access');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly decode valid tokens with verifyToken', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            role: fc.constantFrom('user', 'admin', 'moderator'),
          }),
          async (userData) => {
            const validToken = generateAccessToken({
              id: userData.userId,
              email: userData.email,
              role: userData.role as 'user' | 'admin' | 'moderator',
            });

            // Property: Valid token SHALL be decoded correctly
            const decoded = verifyToken(validToken);
            expect(decoded).not.toBeNull();
            expect(decoded?.userId).toBe(userData.userId);
            expect(decoded?.email).toBe(userData.email);
            expect(decoded?.role).toBe(userData.role);
            expect(decoded?.type).toBe('access');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
