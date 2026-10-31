import axios from 'axios';
import { AuthSession, SCMUserSession, DEFAULT_WORKSPACE_ID } from '@/lib/auth/scm-auth';
import { apiClient } from '@/lib/api-client';
import { clientEnv } from '@/lib/env/client';

const LOGIN_BASE_URL =
  clientEnv.NEXT_PUBLIC_SCM_API_URL.replace(/\/api\/v1\/?$/, '') || 'http://localhost:3002';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface EmployeeLoginRequest {
  employeeCode: string;
  password: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: SCMUserSession;
  forceChange?: boolean;
}

function extractAuthResponse(responseData: unknown): AuthLoginResponse {
  const json = (responseData || {}) as Record<string, unknown>;
  const data = ((json['data'] ?? json) as Record<string, unknown>) || {};
  const tokens = (data.tokens || {}) as Record<string, string>;
  const accessToken = (data.accessToken || data.token || tokens.accessToken || '') as string;
  const refreshToken = (data.refreshToken ||
    tokens.refreshToken ||
    data.refresh_token ||
    '') as string;
  const user = (data.user || data.employee || data) as SCMUserSession;

  return {
    accessToken,
    refreshToken,
    user,
    forceChange: data.forceChange as boolean | undefined,
  };
}

// Use raw axios (NOT apiClient) for login calls to bypass interceptors completely
export async function loginAdminApi(payload: AdminLoginRequest): Promise<AuthLoginResponse> {
  try {
    // Try the correct endpoint first (backend confirms /users/auth/login works)
    const response = await axios.post(`${LOGIN_BASE_URL}/api/v1/users/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return extractAuthResponse(response.data);
  } catch {
    // Fallback to alternate endpoint
    const response = await axios.post(`${LOGIN_BASE_URL}/api/v1/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return extractAuthResponse(response.data);
  }
}

export async function loginEmployeeApi(payload: EmployeeLoginRequest): Promise<AuthLoginResponse> {
  try {
    const response = await axios.post(
      `${LOGIN_BASE_URL}/api/v1/users/auth/employee/login`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      },
    );
    return extractAuthResponse(response.data);
  } catch {
    const response = await axios.post(`${LOGIN_BASE_URL}/api/v1/auth/employee/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    return extractAuthResponse(response.data);
  }
}

export async function refreshTokenApi(currentRefreshToken: string): Promise<AuthLoginResponse> {
  const auth = AuthSession.getStoredAuth();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-refresh-token': currentRefreshToken,
    Authorization: `Bearer ${currentRefreshToken}`,
  };
  if (auth.workspaceId) {
    headers['x-workspace-id'] = auth.workspaceId;
  }

  try {
    const response = await axios.post(
      `${LOGIN_BASE_URL}/api/v1/users/auth/refresh`,
      { refreshToken: currentRefreshToken },
      { headers, timeout: 15000 },
    );
    const result = extractAuthResponse(response.data);
    return {
      ...result,
      refreshToken: result.refreshToken || currentRefreshToken,
      user: result.user || auth.user,
    };
  } catch {
    const response = await axios.post(
      `${LOGIN_BASE_URL}/api/v1/auth/refresh`,
      { refreshToken: currentRefreshToken },
      { headers, timeout: 15000 },
    );
    const result = extractAuthResponse(response.data);
    return {
      ...result,
      refreshToken: result.refreshToken || currentRefreshToken,
      user: result.user || auth.user,
    };
  }
}

/**
 * Fetch user permissions. Accepts an explicit `accessToken` to avoid
 * race conditions where localStorage hasn't been written yet.
 */
export async function fetchUserPermissionsApi(
  userId: string,
  workspaceId: string = DEFAULT_WORKSPACE_ID,
  accessToken?: string,
): Promise<string[]> {
  try {
    if (typeof window === 'undefined' || !userId) {
      return [];
    }

    const token =
      accessToken ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('scm_access_token');

    // Prevent firing without an authentication token
    if (!token) {
      return [];
    }

    const response = await apiClient.get(`/api/v1/authorization/users/${userId}/permissions`, {
      params: { workspaceId },
      headers: {
        'x-workspace-id': workspaceId,
        Authorization: `Bearer ${token.trim()}`,
      },
    });

    const json = response.data || {};
    const rawData = json['data'] ?? json;
    const list = Array.isArray(rawData) ? rawData : [];

    return list
      .map((item: unknown) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const obj = item as { code?: string; name?: string };
          return obj.code || obj.name || '';
        }
        return '';
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
