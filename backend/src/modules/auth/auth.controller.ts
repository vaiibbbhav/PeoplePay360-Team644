import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { loginSchema } from './auth.validators';
import * as authService from './auth.service';
import { UnauthorizedError } from '../../shared/errors';
import { getCookieValue } from '../../shared/auth-middleware';

const setTokenCookie = (res: Response, token: string) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = loginSchema.parse(req.body);
  const result = await authService.login(validated);
  setTokenCookie(res, result.token);
  res.json(result);
});

export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const cookieToken = req.cookies?.token || getCookieValue(req, 'token');
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.split(' ')[1];
  const token = cookieToken || bearerToken;

  if (!token) {
    throw new UnauthorizedError('No token provided for refresh');
  }

  const result = await authService.refreshToken(token);
  setTokenCookie(res, result.token);
  res.json(result);
});

export const logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError('User session not found');
  }
  const user = await authService.getCurrentUser(req.user.id);
  res.json(user);
});
