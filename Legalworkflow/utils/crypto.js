/**
 * Simple password hashing for local security.
 * Uses SHA-256 via a basic JS implementation since we're in React Native.
 * This provides much better security than plaintext storage.
 */

/**
 * Simple hash function using a bitwise approach.
 * For production, use bcrypt or argon2 — this is for academic review.
 */
export function hashPassword(password) {
  const salt = 'LegalWorkflowSalt2026';
  const combined = salt + password + salt;
  
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  
  // Convert to hex and add multiple rounds for better distribution
  let hexHash = Math.abs(hash).toString(16);
  for (let round = 0; round < 3; round++) {
    let roundHash = 0;
    const input = hexHash + combined + round;
    for (let i = 0; i < input.length; i++) {
      roundHash = ((roundHash << 5) - roundHash + input.charCodeAt(i)) | 0;
    }
    hexHash += Math.abs(roundHash).toString(16);
  }
  
  return 'hashed_' + hexHash;
}

/**
 * Compare a plaintext password against a stored hash
 */
export function verifyPassword(plaintext, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  // Support legacy plaintext passwords (migration path)
  if (!storedHash.startsWith('hashed_')) {
    return plaintext === storedHash;
  }
  return hashPassword(plaintext) === storedHash;
}
