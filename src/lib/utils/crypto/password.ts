/**
 * UTILIDADES DE CRIPTOGRAFÍA
 * ==========================
 *
 * Funciones para manejo de contraseñas y criptografía
 */

import { pbkdf2 as _pbkdf2, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const pbkdf2 = promisify(_pbkdf2);

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const iterations = 310000;
  const keylen = 32;
  const digest = 'sha256';
  const derivedKey = await pbkdf2(password, salt, iterations, keylen, digest);
  return [
    'pbkdf2',
    iterations,
    salt,
    derivedKey.toString('hex'),
    digest
  ].join('$');
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  const [algo, iterations, salt, key, digest] = hashed.split('$');
  if (algo !== 'pbkdf2') return false;
  const derivedKey = await pbkdf2(password, salt, parseInt(iterations, 10), key.length / 2, digest);
  return timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
}
