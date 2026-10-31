'use client';

import { SCMUser } from '../types';

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: SCMUser | null;
  workspaceId: string;
  permissions: string[];
  isEmployee: boolean;
}

const PRIMARY_TOKEN_KEY = 'accessToken';
const PRIMARY_REFRESH_TOKEN_KEY = 'refreshToken';
const PRIMARY_WORKSPACE_KEY = 'activeWorkspaceId';

const LEGACY_TOKEN_KEY = 'scm_access_token';
const LEGACY_REFRESH_TOKEN_KEY = 'scm_refresh_token';
const USER_KEY = 'scm_user_data';
const LEGACY_WORKSPACE_KEY = 'scm_workspace_id';
const PERMISSIONS_KEY = 'scm_permissions';
const IS_EMPLOYEE_KEY = 'scm_is_employee';

export const DEFAULT_WORKSPACE_ID = '43a1cac5-1d34-4488-9286-ba6ec6ac5587';

export class AuthSession {
  public static getStoredAuth(): AuthState {
    if (typeof window === 'undefined') {
      return {
        token: null,
        refreshToken: null,
        user: null,
        workspaceId: DEFAULT_WORKSPACE_ID,
        permissions: [],
        isEmployee: false,
      };
    }

    try {
      const token =
        localStorage.getItem(PRIMARY_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
      const refreshToken =
        localStorage.getItem(PRIMARY_REFRESH_TOKEN_KEY) ||
        localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      const user: SCMUser | null = userStr ? JSON.parse(userStr) : null;
      const workspaceId =
        localStorage.getItem(PRIMARY_WORKSPACE_KEY) ||
        localStorage.getItem(LEGACY_WORKSPACE_KEY) ||
        DEFAULT_WORKSPACE_ID;
      const permStr = localStorage.getItem(PERMISSIONS_KEY);
      const permissions: string[] = permStr ? JSON.parse(permStr) : [];
      const isEmployee = localStorage.getItem(IS_EMPLOYEE_KEY) === 'true';

      return { token, refreshToken, user, workspaceId, permissions, isEmployee };
    } catch {
      return {
        token: null,
        refreshToken: null,
        user: null,
        workspaceId: DEFAULT_WORKSPACE_ID,
        permissions: [],
        isEmployee: false,
      };
    }
  }

  public static saveAuth(
    token: string,
    user: SCMUser,
    workspaceId: string = DEFAULT_WORKSPACE_ID,
    permissions: string[] = [],
    isEmployee: boolean = false,
    refreshToken?: string | null,
  ): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(PRIMARY_TOKEN_KEY, token);
    localStorage.setItem(LEGACY_TOKEN_KEY, token);

    if (refreshToken) {
      localStorage.setItem(PRIMARY_REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refreshToken);
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(PRIMARY_WORKSPACE_KEY, workspaceId);
    localStorage.setItem(LEGACY_WORKSPACE_KEY, workspaceId);
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
    localStorage.setItem(IS_EMPLOYEE_KEY, isEmployee ? 'true' : 'false');

    // Also set cookies for SSR or middleware compatibility
    document.cookie = `scm_access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
    if (refreshToken) {
      document.cookie = `scm_refresh_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
    }
    document.cookie = `scm_workspace_id=${workspaceId}; path=/; max-age=86400; SameSite=Lax`;
  }

  public static updateTokens(accessToken: string, refreshToken?: string | null): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(PRIMARY_TOKEN_KEY, accessToken);
    localStorage.setItem(LEGACY_TOKEN_KEY, accessToken);
    document.cookie = `scm_access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;

    if (refreshToken) {
      localStorage.setItem(PRIMARY_REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refreshToken);
      document.cookie = `scm_refresh_token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
    }
  }

  public static updateWorkspaceId(workspaceId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PRIMARY_WORKSPACE_KEY, workspaceId);
    localStorage.setItem(LEGACY_WORKSPACE_KEY, workspaceId);
    document.cookie = `scm_workspace_id=${workspaceId}; path=/; max-age=86400; SameSite=Lax`;
  }

  public static updatePermissions(permissions: string[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  }

  public static clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PRIMARY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(PRIMARY_REFRESH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
    localStorage.removeItem(IS_EMPLOYEE_KEY);

    document.cookie = 'scm_access_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'scm_refresh_token=; path=/; max-age=0; SameSite=Lax';
  }

  public static hasScmAccess(user: SCMUser | null, permissions: string[]): boolean {
    if (!user) return false;
    if (user.isSuperAdmin) return true;

    return (
      permissions.includes('scm:item:read') ||
      permissions.includes('scm:stock:read') ||
      permissions.includes('scm:item:allocate') ||
      permissions.includes('app:scm:access') ||
      permissions.some((code) => code.startsWith('scm:'))
    );
  }

  public static canManageItems(user: SCMUser | null, permissions: string[]): boolean {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return (
      permissions.includes('scm:item:create') ||
      permissions.includes('scm:item:update') ||
      permissions.includes('scm:item:manage') ||
      permissions.includes('app:scm:access') ||
      permissions.includes('scm:*')
    );
  }

  public static canAdjustStock(user: SCMUser | null, permissions: string[]): boolean {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return (
      permissions.includes('scm:stock:adjust') ||
      permissions.includes('scm:stock:manage') ||
      permissions.includes('app:scm:access') ||
      permissions.includes('scm:*')
    );
  }

  public static canAllocate(user: SCMUser | null, permissions: string[]): boolean {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return (
      permissions.includes('scm:item:allocate') ||
      permissions.includes('scm:allocation:create') ||
      permissions.includes('app:scm:access') ||
      permissions.includes('scm:*')
    );
  }

  public static canCancelAllocation(user: SCMUser | null, permissions: string[]): boolean {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return (
      permissions.includes('scm:allocation:cancel') ||
      permissions.includes('scm:allocation:manage') ||
      permissions.includes('app:scm:access') ||
      permissions.includes('scm:*')
    );
  }
}
