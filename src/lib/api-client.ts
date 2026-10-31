import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clientEnv } from '@/lib/env/client';

const API_BASE_URL = clientEnv.NEXT_PUBLIC_APP_URL
  ? clientEnv.NEXT_PUBLIC_SCM_API_URL.replace(/\/api\/v1\/?$/, '')
  : 'http://localhost:3002';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Access Token & Workspace ID
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('scm_access_token');
    const workspaceId =
      localStorage.getItem('activeWorkspaceId') ||
      localStorage.getItem('scm_workspace_id') ||
      '43a1cac5-1d34-4488-9286-ba6ec6ac5587';

    if (token) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    if (workspaceId && !config.headers['x-workspace-id']) {
      config.headers['x-workspace-id'] = workspaceId;
    }
  }
  return config;
});

// Response Interceptor: Auto Refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 on login, refresh, or employee login route, reject immediately — never attempt token refresh
    if (
      !originalRequest ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/employee')
    ) {
      return Promise.reject(error);
    }

    // If the user is currently on the login page, skip all 401 handling — they're mid-login flow
    if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('refreshToken') || localStorage.getItem('scm_refresh_token')
          : null;

      if (!refreshToken) {
        isRefreshing = false;
        // Do NOT call handleLogout here — if there's no refresh token,
        // the user may be mid-login. Just reject and let the caller decide.
        return Promise.reject(error);
      }

      try {
        let response;
        try {
          response = await axios.post(
            `${API_BASE_URL}/api/v1/users/auth/refresh`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-refresh-token': refreshToken,
                Authorization: `Bearer ${refreshToken}`,
              },
            },
          );
        } catch {
          response = await axios.post(
            `${API_BASE_URL}/api/v1/auth/refresh`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-refresh-token': refreshToken,
                Authorization: `Bearer ${refreshToken}`,
              },
            },
          );
        }

        const resData = response.data?.data || response.data || {};
        const tokens = resData.tokens || {};
        const newAccessToken = resData.accessToken || resData.token || tokens.accessToken;
        const newRefreshToken =
          resData.refreshToken || tokens.refreshToken || resData.refresh_token || refreshToken;

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('scm_access_token', newAccessToken);
          document.cookie = `scm_access_token=${newAccessToken}; path=/; max-age=86400; SameSite=Lax`;

          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
            localStorage.setItem('scm_refresh_token', newRefreshToken);
            document.cookie = `scm_refresh_token=${newRefreshToken}; path=/; max-age=604800; SameSite=Lax`;
          }

          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('No access token returned from refresh endpoint');
        }
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        handleLogout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

function handleLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('scm_access_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('scm_refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('scm_user_data');
    localStorage.removeItem('activeWorkspaceId');
    localStorage.removeItem('scm_workspace_id');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
}
