"use strict";
/**
 * Property-Based Test for Password Security
 *
 * Feature: coastal-hazards-merge, Property 14: Password Security
 *
 * Property: For any registered user, the stored password hash SHALL NOT equal
 * the plaintext password, and bcrypt.compare(plaintext, hash) SHALL return true.
 *
 * **Validates: Requirements 10.4**
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
Object.defineProperty(exports, "__esModule", { value: true });
const fc = __importStar(require("fast-check"));
const auth_service_1 = require("../../modules/auth/auth-service");
describe('Property 14: Password Security', () => {
    // Feature: coastal-hazards-merge, Property 14: Password Security
    // **Validates: Requirements 10.4**
    it('should never store password hash equal to plaintext password', async () => {
        await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 72 }), // bcrypt max is 72 bytes
        async (plaintext) => {
            const hash = await (0, auth_service_1.hashPassword)(plaintext);
            // Property: Hash must NEVER equal the plaintext password
            expect(hash).not.toBe(plaintext);
            return true;
        }), { numRuns: 10 });
    });
    it('should verify correct password against its hash', async () => {
        await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 72 }), async (plaintext) => {
            const hash = await (0, auth_service_1.hashPassword)(plaintext);
            // Property: bcrypt.compare(plaintext, hash) SHALL return true
            const isValid = await (0, auth_service_1.verifyPassword)(plaintext, hash);
            expect(isValid).toBe(true);
            return true;
        }), { numRuns: 10 });
    });
    it('should reject incorrect passwords', async () => {
        await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 72 }), fc.string({ minLength: 1, maxLength: 72 }), async (correctPassword, wrongPassword) => {
            // Skip if passwords happen to be the same
            if (correctPassword === wrongPassword) {
                return true;
            }
            const hash = await (0, auth_service_1.hashPassword)(correctPassword);
            // Property: Wrong password should not verify
            const isValid = await (0, auth_service_1.verifyPassword)(wrongPassword, hash);
            expect(isValid).toBe(false);
            return true;
        }), { numRuns: 10 });
    });
    it('should produce different hashes for the same password', async () => {
        await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 72 }), async (plaintext) => {
            const hash1 = await (0, auth_service_1.hashPassword)(plaintext);
            const hash2 = await (0, auth_service_1.hashPassword)(plaintext);
            // Property: Same password should produce different hashes (due to salt)
            expect(hash1).not.toBe(hash2);
            // But both should verify correctly
            const isValid1 = await (0, auth_service_1.verifyPassword)(plaintext, hash1);
            const isValid2 = await (0, auth_service_1.verifyPassword)(plaintext, hash2);
            expect(isValid1).toBe(true);
            expect(isValid2).toBe(true);
            return true;
        }), { numRuns: 10 });
    });
    it('should handle passwords with special characters', async () => {
        await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 72 }), fc.constantFrom('!@#$%^&*()_+-=[]{}|;:,.<>?', '🔐🔑🛡️', '日本語パスワード', 'пароль'), async (base, special) => {
            const password = base + special;
            // Truncate to 72 bytes if needed (bcrypt limit)
            const truncated = password.slice(0, 72);
            const hash = await (0, auth_service_1.hashPassword)(truncated);
            // Hash should not equal plaintext
            expect(hash).not.toBe(truncated);
            // Should verify correctly
            const isValid = await (0, auth_service_1.verifyPassword)(truncated, hash);
            expect(isValid).toBe(true);
            return true;
        }), { numRuns: 10 });
    });
    it('should produce hashes that start with bcrypt identifier', async () => {
        await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 72 }), async (plaintext) => {
            const hash = await (0, auth_service_1.hashPassword)(plaintext);
            // Property: bcrypt hashes start with $2a$ or $2b$
            expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
            return true;
        }), { numRuns: 10 });
    });
});
//# sourceMappingURL=password-security.test.js.map