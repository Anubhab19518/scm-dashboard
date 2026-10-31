import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Auth Service (features/auth/services/auth.service.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should authenticate user via email and store tokens & workspaces', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    const mockedGet = vi.mocked(apiClient.get);

    mockedPost.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'admin-token',
          refreshToken: 'admin-refresh',
          user: {
            id: 'admin-1',
            email: 'admin@corp.com',
            isSuperAdmin: false,
          },
        },
      },
    } as never);

    mockedGet.mockResolvedValueOnce({
      data: {
        data: [
          { id: 'ws-alpha', name: 'Alpha Site' },
          { id: 'ws-beta', name: 'Beta Site' },
        ],
      },
    } as never);

    const result = await authService.login({
      email: 'admin@corp.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('admin-token');
    expect(localStorage.getItem('accessToken')).toBe('admin-token');
    expect(localStorage.getItem('activeWorkspaceId')).toBe('ws-alpha');
  });

  it('should authenticate employee via employeeCode and store tokens', async () => {
    const mockedPost = vi.mocked(apiClient.post);
    const mockedGet = vi.mocked(apiClient.get);

    mockedPost.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'emp-token',
          refreshToken: 'emp-refresh',
          user: {
            id: 'emp-1',
            employeeCode: 'EMP100',
            isSuperAdmin: false,
          },
        },
      },
    } as never);

    mockedGet.mockResolvedValueOnce({
      data: {
        data: [{ id: 'ws-default', name: 'Default Site' }],
      },
    } as never);

    const result = await authService.login({
      employeeCode: 'EMP100',
      password: 'password123',
    });

    expect(result.accessToken).toBe('emp-token');
    expect(localStorage.getItem('accessToken')).toBe('emp-token');
    expect(localStorage.getItem('activeWorkspaceId')).toBe('ws-default');
  });

  it('should fetch and store workspaces for superadmin', async () => {
    const mockedGet = vi.mocked(apiClient.get);
    mockedGet.mockResolvedValueOnce({
      data: {
        data: [{ id: 'ws-global', name: 'Global HQ' }],
      },
    } as never);

    const workspaces = await authService.fetchAndStoreWorkspaces(true);
    expect(workspaces).toHaveLength(1);
    expect(mockedGet).toHaveBeenCalledWith('/api/v1/workspaces/admin/all');
    expect(localStorage.getItem('activeWorkspaceId')).toBe('ws-global');
  });

  it('should clear stored credentials on logout', async () => {
    localStorage.setItem('accessToken', 'tok-123');
    localStorage.setItem('activeWorkspaceId', 'ws-123');
    const mockedPost = vi.mocked(apiClient.post);
    mockedPost.mockResolvedValueOnce({} as never);

    // mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '', pathname: '/dashboard' },
    });

    await authService.logout();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('activeWorkspaceId')).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});
