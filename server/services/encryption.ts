import crypto from "crypto";
import { ENV } from "../_core/env";

/**
 * Encryption Service for API Keys
 * Uses AES-256-GCM encryption with PBKDF2 key derivation
 * 
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - Random IV for each encryption
 * - PBKDF2 key derivation with 100,000 iterations
 * - Authentication tag to prevent tampering
 */

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

/**
 * Get or generate encryption master key
 * In production, this should be stored in a secure vault (AWS KMS, HashiCorp Vault, etc.)
 */
function getMasterKey(): string {
  // Use environment variable or generate a secure key
  // WARNING: In production, NEVER generate keys on the fly - use a secure vault
  const envKey = process.env.ENCRYPTION_MASTER_KEY;
  
  if (!envKey) {
    console.warn(
      "[Security] ENCRYPTION_MASTER_KEY not set. Using JWT_SECRET as fallback. " +
      "For production, set a dedicated ENCRYPTION_MASTER_KEY environment variable."
    );
    return ENV.cookieSecret;
  }
  
  return envKey;
}

/**
 * Derive encryption key from master key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  const masterKey = getMasterKey();
  return crypto.pbkdf2Sync(
    masterKey,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    "sha256"
  );
}

/**
 * Encrypt a value (API key, secret, etc.)
 * Returns base64-encoded string: salt:iv:tag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive encryption key
    const key = deriveKey(salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let ciphertext = cipher.update(plaintext, "utf8", "base64");
    ciphertext += cipher.final("base64");
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt:iv:tag:ciphertext
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(ciphertext, "base64"),
    ]);
    
    return combined.toString("base64");
  } catch (error) {
    console.error("[Encryption] Failed to encrypt:", error);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypt a value
 * Expects base64-encoded string: salt:iv:tag:ciphertext
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return "";
  
  try {
    // Decode from base64
    const combined = Buffer.from(encrypted, "base64");
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive decryption key
    const key = deriveKey(salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let plaintext = decipher.update(ciphertext.toString("base64"), "base64", "utf8");
    plaintext += decipher.final("utf8");
    
    return plaintext;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt:", error);
    throw new Error("Decryption failed - data may be corrupted or key is incorrect");
  }
}

/**
 * Mask an API key for display (show only last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 4) return "••••";
  
  const visibleChars = 4;
  const maskedPart = "•".repeat(Math.max(8, apiKey.length - visibleChars));
  const visiblePart = apiKey.slice(-visibleChars);
  
  return maskedPart + visiblePart;
}

/**
 * Generate a secure random API key (for key rotation)
 */
export function generateSecureKey(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash an API key for comparison (useful for rate limiting, etc.)
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}
