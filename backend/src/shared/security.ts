import type { NextFunction, Request, Response } from 'express';
import { TooManyRequestsError } from './errors';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const MAX_ATTEMPT_ENTRIES = 5000;

function pruneExpiredAttempts(now: number): void {
  if (attempts.size > MAX_ATTEMPT_ENTRIES) {
    attempts.clear();
    return;
  }
  for (const [key, val] of attempts.entries()) {
    if (val.resetAt <= now) {
      attempts.delete(key);
    }
  }
}

export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

export const loginRateLimit = (req: Request, _res: Response, next: NextFunction): void => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  if (attempts.size > 100 && Math.random() < 0.1) {
    pruneExpiredAttempts(now);
  }

  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (current.count >= MAX_LOGIN_ATTEMPTS) {
    throw new TooManyRequestsError('Too many login attempts. Please try again later.');
  }
  current.count += 1;
  next();
};
