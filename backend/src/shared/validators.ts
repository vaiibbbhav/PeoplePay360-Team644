import { z } from 'zod';

/**
 * Validates that a string is formatted as YYYY-MM-DD AND corresponds to a real calendar date
 * (e.g., rejects 2026-02-31, 2026-13-01, 2026-04-31).
 */
export const realCalendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
  .refine(
    (val) => {
      const [y, m, d] = val.split('-').map(Number);
      const parsed = new Date(Date.UTC(y, m - 1, d));
      return (
        parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d
      );
    },
    { message: 'Invalid calendar date' },
  );
