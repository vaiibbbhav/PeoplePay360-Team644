import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { queryClient } from './queryClient';

export const API_URL = import.meta.env.VITE_API_URL;

const PUBLIC_PAGES = ['/', '/login', '/forgot-password', '/reset-password', '/verify-email'];

let isRedirecting = false;

export const isAuthPage = (): boolean =>
  PUBLIC_PAGES.some(
    (path) => window.location.pathname === path || window.location.pathname.startsWith(`${path}/`),
  );

/**
 * Public client for unauthenticated endpoints (login, register, public landing).
 */
export const publicApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
});

/**
 * Primary authenticated client for protected operations.
 */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 60000,
});

/**
 * Biometric client for fingerprint terminal operations.
 */
export const fingerprintApi = axios.create({
  baseURL: import.meta.env.VITE_FINGERPRINT_API_URL || '/api/fingerprint',
  withCredentials: true,
  timeout: 30000,
});

// Single-flight refresh promise lock
let refreshPromise: Promise<void> | null = null;

export const refreshToken = async (): Promise<void> => {
  await publicApi.post('/auth/refresh');
};

const getRefreshPromise = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = refreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// Response interceptor for rate-limiting (429) & error handling
const handleResponseSuccess = (response: AxiosResponse) => response;

const handleRateLimitAndErrors = async (error: AxiosError<{ error?: string }>) => {
  const status = error.response?.status;

  if (status === 429) {
    const message = error.response?.data?.error || 'Too many requests. Please try again later.';
    console.warn('[RateLimit]', message);

    if (!isAuthPage()) {
      queryClient.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }

  return Promise.reject(error);
};

// 401 automatic refresh and retry interceptor for authenticated calls
api.interceptors.response.use(
  handleResponseSuccess,
  async (error: AxiosError<{ error?: string }>) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest) {
      return handleRateLimitAndErrors(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isAuthPage()) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        await getRefreshPromise();
        return api(originalRequest);
      } catch (refreshErr) {
        if (!isAuthPage() && !isRedirecting) {
          isRedirecting = true;
          queryClient.clear();
          window.location.replace('/login?reason=session-expired');
        }
        return Promise.reject(refreshErr);
      }
    }

    return handleRateLimitAndErrors(error);
  },
);

publicApi.interceptors.response.use(handleResponseSuccess, handleRateLimitAndErrors);
fingerprintApi.interceptors.response.use(handleResponseSuccess, handleRateLimitAndErrors);
