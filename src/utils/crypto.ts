/**
 * Pluto OS Hardware-Accelerated Web Crypto Utilities
 * Real 256-bit AES-GCM and PBKDF2 end-to-end encryption.
 */

// Helper: Convert string to ArrayBuffer
function str2ab(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper: Convert ArrayBuffer to string
function ab2str(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

// Helper: Convert bytes to Hex
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert Hex to bytes
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Derive an AES-GCM 256-bit CryptoKey from a user passphrase and salt using PBKDF2.
 */
export async function deriveKeyFromPassphrase(passphrase: string, saltHex?: string): Promise<{ key: CryptoKey; saltHex: string }> {
  const salt = saltHex ? hexToBytes(saltHex) : window.crypto.getRandomValues(new Uint8Array(16));
  const rawKey = await window.crypto.subtle.importKey(
    'raw',
    str2ab(passphrase) as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return {
    key: derivedKey,
    saltHex: bytesToHex(salt),
  };
}

/**
 * Encrypt arbitrary plain text with AES-GCM using the user's passphrase.
 * Returns an encrypted payload containing salt:iv:ciphertext (all in hex).
 */
export async function encryptTextWithPassphrase(text: string, passphrase: string): Promise<string> {
  const { key, saltHex } = await deriveKeyFromPassphrase(passphrase);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = str2ab(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encodedText as unknown as BufferSource
  );

  const ivHex = bytesToHex(iv);
  const cipherHex = bytesToHex(new Uint8Array(ciphertext));

  return `${saltHex}:${ivHex}:${cipherHex}`;
}

/**
 * Decrypt an AES-GCM payload with the user's passphrase.
 */
export async function decryptTextWithPassphrase(encryptedPayload: string, passphrase: string): Promise<string> {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [saltHex, ivHex, cipherHex] = parts;
  const { key } = await deriveKeyFromPassphrase(passphrase, saltHex);
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(cipherHex);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    ciphertext as unknown as BufferSource
  );

  return ab2str(decrypted);
}

/**
 * Generate a cryptographically secure random vault recovery key (24-word/hex).
 */
export function generateVaultMasterKey(): string {
  const bytes = window.crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes).match(/.{1,4}/g)?.join('-').toUpperCase() || 'PLUTO-E2EE-VAULT-KEY';
}

/**
 * Compute SHA-256 hash of a string (useful for password protection and verification).
 */
export async function computeHash(text: string): Promise<string> {
  const data = str2ab(text);
  const hash = await window.crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  return bytesToHex(new Uint8Array(hash));
}
