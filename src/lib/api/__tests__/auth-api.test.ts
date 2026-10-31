import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  loginAdminApi,
  loginEmployeeApi,
  refreshTokenApi,
  fetchUserPermissionsApi,
} from '../auth-api';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('Auth API Services (lib/api/auth-api.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should authenticate admin and return normalized tokens and user', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'admin-access-token-123',
          refreshToken: 'admin-refresh-token-456',
          user: {
            id: 'admin-1',
            email: 'admin@corp.com',
            name: 'Corporate Admin',
          },
        },
      },
    });

    const res = await loginAdminApi({
      email: 'admin@corp.com',
      password: 'StrongPassword123!',
    });

    expect(res.accessToken).toBe('admin-access-token-123');
    expect(res.refreshToken).toBe('admin-refresh-token-456');
    expect(res.user.email).toBe('admin@corp.com');
  });

  it('should authenticate employee with employeeCode and credentials', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          token: 'employee-jwt-token',
          refreshToken: 'emp-refresh',
          employee: {
            id: 'emp-99',
            employeeCode: 'EMP-007',
            name: 'James Bond',
          },
        },
      },
    });

    const res = await loginEmployeeApi({
      employeeCode: 'EMP-007',
      password: 'SecretPassword!',
    });

    expect(res.accessToken).toBe('employee-jwt-token');
    expect(res.refreshToken).toBe('emp-refresh');
    expect(res.user.id).toBe('emp-99');
  });

  it('should fallback to secondary endpoints if primary endpoint fails with 404', async () => {
    mockedAxios.post
      .mockRejectedValueOnce({
        response: { status: 404 },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            accessToken: 'fallback-token-abc',
            user: { id: 'admin-fallback' },
          },
        },
      });

    const res = await loginAdminApi({
      email: 'admin@corp.com',
      password: 'password',
    });

    expect(res.accessToken).toBe('fallback-token-abc');
  });

  it('should call refreshTokenApi and fallback when primary refresh endpoint throws', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Endpoint not found')).mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'new-token-from-refresh',
          refreshToken: 'new-refresh-token',
        },
      },
    });

    const res = await refreshTokenApi('old-refresh-token');
    expect(res.accessToken).toBe('new-token-from-refresh');
  });

  it('should fetch user permissions when userId and token are present', async () => {
    const mockedGet = vi.mocked(apiClient.get);
    mockedGet.mockResolvedValueOnce({
      data: {
        data: [{ code: 'scm:item:read' }, { name: 'scm:allocate' }, 'scm:stock:adjust'],
      },
    } as never);

    const perms = await fetchUserPermissionsApi('usr-1', 'ws-1', 'token-abc');
    expect(perms).toEqual(['scm:item:read', 'scm:allocate', 'scm:stock:adjust']);
  });

  it('should return empty array if no token or userId provided in fetchUserPermissionsApi', async () => {
    const perms = await fetchUserPermissionsApi('');
    expect(perms).toEqual([]);
  });
});
