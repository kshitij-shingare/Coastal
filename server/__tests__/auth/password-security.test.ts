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

import * as fc from 'fast-check';
import { hashPassword, verifyPassword } from '../../modules/auth/auth-service';

describe('Property 14: Password Security', () => {
  // Feature: coastal-hazards-merge, Property 14: Password Security
  // **Validates: Requirements 10.4**

  it('should never store password hash equal to plaintext password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }), // bcrypt max is 72 bytes
        async (plaintext) => {
          const hash = await hashPassword(plaintext);
          
          // Property: Hash must NEVER equal the plaintext password
          expect(hash).not.toBe(plaintext);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should verify correct password against its hash', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        async (plaintext) => {
          const hash = await hashPassword(plaintext);
          
          // Property: bcrypt.compare(plaintext, hash) SHALL return true
          const isValid = await verifyPassword(plaintext, hash);
          expect(isValid).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject incorrect passwords', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        fc.string({ minLength: 1, maxLength: 72 }),
        async (correctPassword, wrongPassword) => {
          // Skip if passwords happen to be the same
          if (correctPassword === wrongPassword) {
            return true;
          }
          
          const hash = await hashPassword(correctPassword);
          
          // Property: Wrong password should not verify
          const isValid = await verifyPassword(wrongPassword, hash);
          expect(isValid).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should produce different hashes for the same password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        async (plaintext) => {
          const hash1 = await hashPassword(plaintext);
          const hash2 = await hashPassword(plaintext);
          
          // Property: Same password should produce different hashes (due to salt)
          expect(hash1).not.toBe(hash2);
          
          // But both should verify correctly
          const isValid1 = await verifyPassword(plaintext, hash1);
          const isValid2 = await verifyPassword(plaintext, hash2);
          expect(isValid1).toBe(true);
          expect(isValid2).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle passwords with special characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        fc.constantFrom('!@#$%^&*()_+-=[]{}|;:,.<>?', '🔐🔑🛡️', '日本語パスワード', 'пароль'),
        async (base, special) => {
          const password = base + special;
          // Truncate to 72 bytes if needed (bcrypt limit)
          const truncated = password.slice(0, 72);
          
          const hash = await hashPassword(truncated);
          
          // Hash should not equal plaintext
          expect(hash).not.toBe(truncated);
          
          // Should verify correctly
          const isValid = await verifyPassword(truncated, hash);
          expect(isValid).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should produce hashes that start with bcrypt identifier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        async (plaintext) => {
          const hash = await hashPassword(plaintext);
          
          // Property: bcrypt hashes start with $2a$ or $2b$
          expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
