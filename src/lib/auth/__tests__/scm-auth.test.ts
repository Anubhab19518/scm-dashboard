import { describe, it, expect, beforeEach } from 'vitest';
import { AuthSession, DEFAULT_WORKSPACE_ID } from '../scm-auth';

describe('SCM AuthSession Client Storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should return default empty auth state when nothing stored', () => {
    const auth = AuthSession.getStoredAuth();
    expect(auth.token).toBeNull();
    expect(auth.refreshToken).toBeNull();
    expect(auth.user).toBeNull();
    expect(auth.workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(auth.permissions).toEqual([]);
    expect(auth.isEmployee).toBe(false);
  });

  it('should save and retrieve auth session correctly', () => {
    AuthSession.saveAuth(
      'jwt-access-token-123',
      {
        id: 'user-1',
        employeeCode: 'EMP001',
        name: 'John Doe',
      },
      'ws-custom-1',
      ['scm:read', 'scm:allocate'],
      true,
      'jwt-refresh-token-456',
    );

    const stored = AuthSession.getStoredAuth();
    expect(stored.token).toBe('jwt-access-token-123');
    expect(stored.refreshToken).toBe('jwt-refresh-token-456');
    expect(stored.workspaceId).toBe('ws-custom-1');
    expect(stored.isEmployee).toBe(true);
    expect(stored.permissions).toEqual(['scm:read', 'scm:allocate']);
    expect(stored.user?.name).toBe('John Doe');
  });

  it('should update active workspace and token individually', () => {
    AuthSession.updateWorkspaceId('ws-new-888');
    const stored = AuthSession.getStoredAuth();
    expect(stored.workspaceId).toBe('ws-new-888');

    AuthSession.updateTokens('updated-token-999', 'updated-refresh-888');
    const afterTokens = AuthSession.getStoredAuth();
    expect(afterTokens.token).toBe('updated-token-999');
    expect(afterTokens.refreshToken).toBe('updated-refresh-888');
  });

  it('should clear stored credentials on clearAuth', () => {
    AuthSession.saveAuth('token-to-clear', { id: 'u-1' });

    AuthSession.clearAuth();
    const stored = AuthSession.getStoredAuth();
    expect(stored.token).toBeNull();
    expect(stored.user).toBeNull();
  });

  it('should check permissions with hasScmAccess', () => {
    expect(AuthSession.hasScmAccess(null, [])).toBe(false);
    expect(AuthSession.hasScmAccess({ id: '1', isSuperAdmin: true }, [])).toBe(true);
    expect(AuthSession.hasScmAccess({ id: '2', isSuperAdmin: false }, ['scm:item:read'])).toBe(
      true,
    );
    expect(AuthSession.hasScmAccess({ id: '3', isSuperAdmin: false }, ['billing:read'])).toBe(
      false,
    );
  });
});
