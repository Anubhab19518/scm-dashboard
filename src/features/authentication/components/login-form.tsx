'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdminApi, loginEmployeeApi, fetchUserPermissionsApi } from '@/lib/api/auth-api';
import { AuthSession, DEFAULT_WORKSPACE_ID } from '@/lib/auth/scm-auth';
import { apiClient } from '@/lib/api-client';

export function LoginForm() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('scm.manager@urgentmanpower.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [workspaceId, setWorkspaceId] = useState(DEFAULT_WORKSPACE_ID);
  const [showWorkspace, setShowWorkspace] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your identifier and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const activeWorkspace = workspaceId.trim() || DEFAULT_WORKSPACE_ID;
    const isEmail = identifier.includes('@');

    try {
      if (isEmail) {
        // Corporate / Admin Email Login
        const response = await loginAdminApi({
          email: identifier.trim(),
          password,
        });

        const user = response.user;
        const accessToken = response.accessToken;
        const refreshToken = response.refreshToken;

        // 1. Store tokens FIRST in localStorage and session
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('scm_access_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('scm_refresh_token', refreshToken);
          }
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('scm_user_data', JSON.stringify(user));
          localStorage.setItem('activeWorkspaceId', activeWorkspace);
          localStorage.setItem('scm_workspace_id', activeWorkspace);
        }

        // 2. Explicitly update apiClient default header
        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        // 3. Save to AuthSession
        AuthSession.saveAuth(accessToken, user, activeWorkspace, [], false, refreshToken);

        // 4. Safely fetch permissions — pass token explicitly to avoid any localStorage race
        const permissions = await fetchUserPermissionsApi(
          user.id,
          activeWorkspace,
          accessToken,
        ).catch(() => []);
        if (permissions.length > 0) {
          AuthSession.updatePermissions(permissions);
        }

        setSuccessMessage(
          `Welcome, ${user.firstName || user.email || 'Admin'}! Loading SCM Dashboard...`,
        );
        setTimeout(() => {
          router.push('/scm/dashboard');
        }, 300);
      } else {
        // Staff / Employee Code Login (e.g. EMP4991)
        const response = await loginEmployeeApi({
          employeeCode: identifier.trim().toUpperCase(),
          password,
        });

        const user = response.user;
        const accessToken = response.accessToken;
        const refreshToken = response.refreshToken;

        // 1. Store tokens FIRST in localStorage and session
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('scm_access_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('scm_refresh_token', refreshToken);
          }
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('scm_user_data', JSON.stringify(user));
          localStorage.setItem('activeWorkspaceId', activeWorkspace);
          localStorage.setItem('scm_workspace_id', activeWorkspace);
        }

        // 2. Explicitly update apiClient default header
        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        // 3. Save to AuthSession
        AuthSession.saveAuth(accessToken, user, activeWorkspace, [], true, refreshToken);

        // 4. Safely fetch permissions — pass token explicitly to avoid any localStorage race
        const permissions = await fetchUserPermissionsApi(
          user.id,
          activeWorkspace,
          accessToken,
        ).catch(() => []);
        if (permissions.length > 0) {
          AuthSession.updatePermissions(permissions);
        }
        const hasAdminAccess = AuthSession.hasScmAccess(user, permissions);

        setSuccessMessage(
          `Welcome, ${user.firstName || user.employeeCode || 'Employee'}! Loading portal...`,
        );

        setTimeout(() => {
          if (hasAdminAccess) {
            router.push('/scm/dashboard');
          } else {
            router.push('/scm/my-equipment');
          }
        }, 300);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please verify your email or employee code.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setIdentifier('scm.manager@urgentmanpower.com');
    setPassword('Password123!');
  };

  const handleFillEmployee = () => {
    setIdentifier('EMP4991');
    setPassword('Password123!');
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%',
      }}
    >
      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Email or Employee Code Input */}
      <div>
        <label
          htmlFor="scm-identifier"
          style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#334155',
            marginBottom: '0.4rem',
          }}
        >
          Email Address or Employee Code
        </label>
        <input
          id="scm-identifier"
          type="text"
          name="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="e.g. admin@company.com or EMP4991"
          required
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#0f172a',
            outline: 'none',
            transition: 'border-color 150ms ease',
          }}
        />
      </div>

      {/* Password Input with eye toggle */}
      <div>
        <label
          htmlFor="scm-password"
          style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#334155',
            marginBottom: '0.4rem',
          }}
        >
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="scm-password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem 2.75rem 0.75rem 1rem',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              outline: 'none',
              transition: 'border-color 150ms ease',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
            }}
          >
            {showPassword ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Workspace toggle (collapsible) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowWorkspace(!showWorkspace)}
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {showWorkspace ? 'Hide Workspace ID' : 'Workspace ID (Advanced)'}
          </button>
        </div>

        {showWorkspace && (
          <input
            type="text"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            placeholder={DEFAULT_WORKSPACE_ID}
            style={{
              width: '100%',
              marginTop: '0.35rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.78rem',
              fontFamily: 'inherit',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#475569',
            }}
          />
        )}
      </div>

      {/* Primary Sign In Button */}
      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '0.8rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          color: '#ffffff',
          backgroundColor: '#4f46e5',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgb(79 70 229 / 0.3)',
          transition: 'background-color 150ms ease',
        }}
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>

      {/* Quick Autofill Helper Pills */}
      <div
        style={{
          marginTop: '0.5rem',
          padding: '0.75rem',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
          Quick Demo Credentials:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleFillAdmin}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 500,
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#4f46e5',
              cursor: 'pointer',
            }}
          >
            Admin (Email)
          </button>
          <button
            type="button"
            onClick={handleFillEmployee}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 500,
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#4f46e5',
              cursor: 'pointer',
            }}
          >
            Staff / Employee (EMP4991)
          </button>
        </div>
      </div>
    </form>
  );
}
