import { randomBytes, pbkdf2 as _pbkdf2, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const pbkdf2 = promisify(_pbkdf2);

/**
 * Format a date string (YYYY-MM-DD) to a more readable format
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr; // Return original if formatting fails
  }
}

/**
 * Format a time string (HH:MM) to a more readable format
 */
export function formatTime(timeStr: string): string {
  try {
    // Create a date object with the time string
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);

    return new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true 
    }).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeStr; // Return original if formatting fails
  }
}

/**
 * Generate a human-readable relative time (e.g., "2 hours ago")
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
}

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

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  const [algo, iterations, salt, key, digest] = hashed.split('$');
  if (algo !== 'pbkdf2') return false;
  const derivedKey = await pbkdf2(password, salt, parseInt(iterations, 10), key.length / 2, digest);
  return timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
} 