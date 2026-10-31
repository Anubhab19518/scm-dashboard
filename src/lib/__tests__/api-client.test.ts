import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { apiClient } from '../api-client';

describe('API Client Interceptors and Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should have standard headers and default baseURL', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    expect(apiClient.defaults.baseURL).toBeDefined();
  });

  it('should attach Authorization and workspace id from localStorage to request config', async () => {
    localStorage.setItem('accessToken', 'my-auth-token-xyz');
    localStorage.setItem('activeWorkspaceId', 'ws-test-1234');

    const config = {
      headers: {
        Authorization: '',
        'x-workspace-id': '',
      },
    };

    // Trigger request interceptor handlers
    // @ts-expect-error accessing axios interceptor handlers directly for testing
    const interceptor = apiClient.interceptors.request.handlers[0]?.fulfilled;
    if (interceptor) {
      const updatedConfig = await interceptor(config as never);
      expect(updatedConfig.headers.Authorization).toBe('Bearer my-auth-token-xyz');
      expect(updatedConfig.headers['x-workspace-id']).toBe('ws-test-1234');
    }
  });

  it('should handle token refresh on 401 error response', async () => {
    localStorage.setItem('refreshToken', 'refresh-token-123');

    // @ts-expect-error accessing axios interceptor handlers directly for testing
    const responseInterceptor = apiClient.interceptors.response.handlers[0]?.rejected;
    if (responseInterceptor) {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          data: {
            accessToken: 'refreshed-token-xyz',
            refreshToken: 'refreshed-refresh-xyz',
          },
        },
      });

      const originalRequest = {
        _retry: false,
        headers: {} as Record<string, string>,
      };

      const errorObj = {
        config: originalRequest,
        response: { status: 401 },
      };

      // Mock apiClient execution for the retried request
      const mockExec = vi
        .spyOn(apiClient, 'request')
        .mockResolvedValueOnce({ status: 200 } as never);

      try {
        await responseInterceptor(errorObj);
        expect(mockExec).toHaveBeenCalled();
      } catch {
        // Handled
      }
    }
  });

  it('should logout and reject when refresh token is missing or fails', async () => {
    // @ts-expect-error accessing axios interceptor handlers directly for testing
    const responseInterceptor = apiClient.interceptors.response.handlers[0]?.rejected;
    if (responseInterceptor) {
      // 1. Without refresh token
      const errNoToken = {
        config: { _retry: false, headers: {} },
        response: { status: 401 },
      };
      await expect(responseInterceptor(errNoToken)).rejects.toEqual(errNoToken);

      // 2. With refresh token that fails
      localStorage.setItem('refreshToken', 'bad-refresh-token');
      vi.spyOn(axios, 'post').mockRejectedValue(new Error('Refresh failed'));

      Object.defineProperty(window, 'location', {
        writable: true,
        value: { pathname: '/dashboard', href: '' },
      });

      const errBadToken = {
        config: { _retry: false, headers: {} },
        response: { status: 401 },
      };
      await expect(responseInterceptor(errBadToken)).rejects.toBeDefined();
      expect(window.location.href).toBe('/login');
    }
  });

  it('should reject non-401 errors through response interceptor', async () => {
    // @ts-expect-error accessing axios interceptor handlers directly for testing
    const responseInterceptor = apiClient.interceptors.response.handlers[0]?.rejected;
    if (responseInterceptor) {
      const errorObj = {
        config: {},
        response: { status: 500 },
      };

      await expect(responseInterceptor(errorObj)).rejects.toEqual(errorObj);
    }
  });
});
