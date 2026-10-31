import { describe, it, expect, beforeEach } from 'vitest';
import { AuthSession, DEFAULT_WORKSPACE_ID } from '../services/auth-session';
import { SCMUser } from '../types';

describe('AuthSession & SCM Permission Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default empty session when nothing stored', () => {
    const auth = AuthSession.getStoredAuth();
    expect(auth.token).toBeNull();
    expect(auth.refreshToken).toBeNull();
    expect(auth.user).toBeNull();
    expect(auth.workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(auth.permissions).toEqual([]);
    expect(auth.isEmployee).toBe(false);
  });

  it('should evaluate hasScmAccess correctly for SuperAdmin', () => {
    const adminUser: SCMUser = {
      id: 'usr-admin',
      email: 'admin@wok.in',
      isSuperAdmin: true,
    };

    expect(AuthSession.hasScmAccess(adminUser, [])).toBe(true);
    expect(AuthSession.hasScmAccess(null, [])).toBe(false);
  });

  it('should evaluate granular capabilities (canManageItems, canAdjustStock, canAllocate, canCancelAllocation)', () => {
    const managerUser: SCMUser = {
      id: 'usr-mgr',
      email: 'scm.manager@urgentmanpower.com',
      isSuperAdmin: false,
    };

    expect(AuthSession.canManageItems(null, [])).toBe(false);
    expect(AuthSession.canManageItems(managerUser, ['scm:item:create'])).toBe(true);
    expect(AuthSession.canManageItems(managerUser, ['other:perm'])).toBe(false);

    expect(AuthSession.canAdjustStock(null, [])).toBe(false);
    expect(AuthSession.canAdjustStock(managerUser, ['scm:stock:adjust'])).toBe(true);
    expect(AuthSession.canAdjustStock(managerUser, ['other:perm'])).toBe(false);

    expect(AuthSession.canAllocate(null, [])).toBe(false);
    expect(AuthSession.canAllocate(managerUser, ['scm:item:allocate'])).toBe(true);
    expect(AuthSession.canAllocate(managerUser, ['other:perm'])).toBe(false);

    expect(AuthSession.canCancelAllocation(null, [])).toBe(false);
    expect(AuthSession.canCancelAllocation(managerUser, ['scm:allocation:cancel'])).toBe(true);
    expect(AuthSession.canCancelAllocation(managerUser, ['other:perm'])).toBe(false);

    const superUser: SCMUser = { id: 's-1', isSuperAdmin: true };
    expect(AuthSession.canManageItems(superUser, [])).toBe(true);
    expect(AuthSession.canAdjustStock(superUser, [])).toBe(true);
    expect(AuthSession.canAllocate(superUser, [])).toBe(true);
    expect(AuthSession.canCancelAllocation(superUser, [])).toBe(true);
  });

  it('should save and load auth session with refreshToken from localStorage', () => {
    const user: SCMUser = {
      id: 'usr-123',
      firstName: 'Shakti',
      lastName: 'Mohan',
    };

    AuthSession.saveAuth(
      'test-token-jwt',
      user,
      'ws-456',
      ['scm:item:read'],
      true,
      'test-refresh-jwt',
    );

    const stored = AuthSession.getStoredAuth();
    expect(stored.token).toBe('test-token-jwt');
    expect(stored.refreshToken).toBe('test-refresh-jwt');
    expect(stored.workspaceId).toBe('ws-456');
    expect(stored.user?.firstName).toBe('Shakti');
    expect(stored.isEmployee).toBe(true);
    expect(stored.permissions).toContain('scm:item:read');

    AuthSession.updateTokens('new-token-jwt', 'new-refresh-jwt');
    const updated = AuthSession.getStoredAuth();
    expect(updated.token).toBe('new-token-jwt');
    expect(updated.refreshToken).toBe('new-refresh-jwt');

    AuthSession.updateWorkspaceId('ws-789');
    expect(AuthSession.getStoredAuth().workspaceId).toBe('ws-789');

    AuthSession.updatePermissions(['scm:write']);
    expect(AuthSession.getStoredAuth().permissions).toEqual(['scm:write']);

    AuthSession.clearAuth();
    expect(AuthSession.getStoredAuth().token).toBeNull();
  });
});
