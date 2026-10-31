import { describe, it, expect } from 'vitest';
import { hasPermission, assertAuthorized, UserSession } from '../rbac';

describe('RBAC Authorization (AGENTS.md Rule 16)', () => {
  const adminUser: UserSession = {
    id: 'u-1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
  };

  const managerUser: UserSession = {
    id: 'u-2',
    email: 'manager@test.com',
    name: 'Manager User',
    role: 'manager',
  };

  const viewerUser: UserSession = {
    id: 'u-3',
    email: 'viewer@test.com',
    name: 'Viewer User',
    role: 'viewer',
  };

  it('should grant admin all permissions', () => {
    expect(hasPermission(adminUser, 'orders:read')).toBe(true);
    expect(hasPermission(adminUser, 'orders:create')).toBe(true);
    expect(hasPermission(adminUser, 'orders:delete')).toBe(true);
    expect(hasPermission(adminUser, 'users:manage')).toBe(true);
  });

  it('should restrict manager from users:manage and orders:delete', () => {
    expect(hasPermission(managerUser, 'orders:read')).toBe(true);
    expect(hasPermission(managerUser, 'orders:approve_high_value')).toBe(true);
    expect(hasPermission(managerUser, 'orders:delete')).toBe(false);
    expect(hasPermission(managerUser, 'users:manage')).toBe(false);
  });

  it('should only grant viewer orders:read', () => {
    expect(hasPermission(viewerUser, 'orders:read')).toBe(true);
    expect(hasPermission(viewerUser, 'orders:create')).toBe(false);
    expect(hasPermission(viewerUser, 'orders:update')).toBe(false);
  });

  it('should throw error on assertAuthorized when permission is missing', () => {
    expect(() => assertAuthorized(viewerUser, 'orders:delete')).toThrow(
      "Unauthorized: Role 'viewer' lacks permission 'orders:delete'",
    );
  });

  it('should not throw on assertAuthorized when authorized', () => {
    expect(() => assertAuthorized(adminUser, 'orders:delete')).not.toThrow();
  });
});
