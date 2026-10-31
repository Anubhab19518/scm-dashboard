import { apiClient } from '@/lib/api-client';

export interface LoginDto {
  email?: string;
  employeeCode?: string;
  password?: string;
}

export const authService = {
  async login(credentials: LoginDto) {
    let response;
    if (credentials.email) {
      try {
        response = await apiClient.post('/api/v1/auth/login', {
          email: credentials.email,
          password: credentials.password,
        });
      } catch {
        response = await apiClient.post('/api/v1/users/auth/login', {
          email: credentials.email,
          password: credentials.password,
        });
      }
    } else {
      try {
        response = await apiClient.post('/api/v1/auth/employee/login', {
          employeeCode: credentials.employeeCode,
          password: credentials.password,
        });
      } catch {
        response = await apiClient.post('/api/v1/users/auth/employee/login', {
          employeeCode: credentials.employeeCode,
          password: credentials.password,
        });
      }
    }

    const resData = response.data?.data || response.data || {};
    const tokens = resData.tokens || {};
    const accessToken = resData.accessToken || resData.token || tokens.accessToken;
    const refreshToken = resData.refreshToken || tokens.refreshToken || resData.refresh_token;
    const user = resData.user || resData.employee || resData;

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('scm_access_token', accessToken);
      document.cookie = `scm_access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
    }

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('scm_refresh_token', refreshToken);
      document.cookie = `scm_refresh_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('scm_user_data', JSON.stringify(user));
    }

    // Fetch workspaces immediately after login
    await this.fetchAndStoreWorkspaces(Boolean(user?.isSuperAdmin));
    return { accessToken, refreshToken, user };
  },

  async fetchAndStoreWorkspaces(isSuperAdmin = false) {
    try {
      const endpoint = isSuperAdmin ? '/api/v1/workspaces/admin/all' : '/api/v1/workspaces';
      const res = await apiClient.get(endpoint);
      const workspaces = res.data?.data || res.data || [];
      if (Array.isArray(workspaces) && workspaces.length > 0) {
        const currentActive =
          localStorage.getItem('activeWorkspaceId') || localStorage.getItem('scm_workspace_id');

        // If current active is invalid or not in list, set to first workspace
        if (!currentActive || !workspaces.some((w: { id?: string }) => w.id === currentActive)) {
          localStorage.setItem('activeWorkspaceId', workspaces[0].id);
          localStorage.setItem('scm_workspace_id', workspaces[0].id);
          document.cookie = `scm_workspace_id=${workspaces[0].id}; path=/; max-age=86400; SameSite=Lax`;
        }
      }
      return workspaces;
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
      return [];
    }
  },

  async logout() {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('scm_access_token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('scm_refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('scm_user_data');
      localStorage.removeItem('activeWorkspaceId');
      localStorage.removeItem('scm_workspace_id');
      window.location.href = '/login';
    }
  },
};
