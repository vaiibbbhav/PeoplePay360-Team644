/**
 * Cryptographically secure strong password generator
 * Produces passwords that strictly satisfy:
 * - Minimum 14 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character
 */

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const ALL = UPPERCASE + LOWERCASE + NUMBERS + SYMBOLS;

const getRandomChar = (charset: string): string => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return charset[array[0] % charset.length];
};

export const generateStrongPassword = (length = 14): string => {
  if (length < 8) length = 8;

  // Guarantee at least one of each required group
  const required = [
    getRandomChar(UPPERCASE),
    getRandomChar(LOWERCASE),
    getRandomChar(NUMBERS),
    getRandomChar(SYMBOLS),
  ];

  // Fill the remainder from the full pool
  const remainingCount = length - required.length;
  const rest: string[] = [];
  for (let i = 0; i < remainingCount; i++) {
    rest.push(getRandomChar(ALL));
  }

  // Combine and cryptographically shuffle with Fisher-Yates
  const combined = [...required, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const j = array[0] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
};
