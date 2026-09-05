import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Public API client for endpoints that do NOT require authentication
 * (e.g. login, register, public landing data)
 */
export const publicApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000,
});


/**
 * Refresh token request using cookie-based credentials
 */
export const refreshToken = async (): Promise<void> => {
  await publicApi.post('/auth/refresh');
};

/**
 * Standard authenticated API client for protected endpoints.
 * Includes automatic 401 interception with queue-locking and refresh flow.
 */
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 12000000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      return reject(error);
    }
    return resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isAuthError =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/register' &&
      window.location.pathname !== '/';

    if (isAuthError) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshToken();
        isRefreshing = false;
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        isRefreshing = false;
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error as AxiosError);
  }
);

// Backward-compatible alias
export const apiClient = api;
