'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthSession, AuthState } from '../services/auth-session';
import { ToastProvider } from './shared/toast-provider';
import { WorkspaceSelector } from './shared/workspace-selector';
import {
  IconPackage,
  IconDashboard,
  IconFileText,
  IconLayers,
  IconTruck,
  IconUser,
  IconSearch,
  IconBell,
  IconChevronRight,
} from './shared/scm-icons';

interface ScmShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/scm/dashboard',
    icon: <IconDashboard size={18} />,
  },
  {
    label: 'Items & Inventory',
    href: '/scm/items',
    icon: <IconPackage size={18} />,
  },
  {
    label: 'Stock Ledger',
    href: '/scm/stock-ledger',
    icon: <IconFileText size={18} />,
  },
  {
    label: 'Kits & Sets',
    href: '/scm/sets',
    icon: <IconLayers size={18} />,
  },
  {
    label: 'Allocations & Dispatch',
    href: '/scm/allocations',
    icon: <IconTruck size={18} />,
  },
  {
    label: 'My Equipment',
    href: '/scm/my-equipment',
    icon: <IconUser size={18} />,
  },
];

export function ScmShell({ children }: ScmShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const current = AuthSession.getStoredAuth();
    setAuth(current);
  }, []);

  const handleLogout = () => {
    AuthSession.clearAuth();
    router.push('/login');
  };

  const username =
    auth?.user?.name ||
    (auth?.user?.firstName ? `${auth.user.firstName} ${auth.user.lastName || ''}`.trim() : '') ||
    auth?.user?.email?.split('@')[0] ||
    'anubhab.19518';

  const userInitial = (username[0] || 'A').toUpperCase();

  return (
    <ToastProvider>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'var(--font-family-sans)',
        }}
      >
        {/* Left Sidebar */}
        <aside
          style={{
            width: '240px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 40,
          }}
        >
          {/* Logo & Brand */}
          <div
            style={{
              padding: '1.25rem 1.25rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              <IconPackage size={20} color="#ffffff" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 650,
                  fontSize: '1.05rem',
                  letterSpacing: '-0.02em',
                  color: '#0f172a',
                  lineHeight: 1.2,
                }}
              >
                SCM
              </div>
              <div
                style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}
              >
                Enterprise Inventory
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav
            style={{
              flex: 1,
              padding: '0.85rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#94a3b8',
                fontWeight: 600,
                padding: '0.25rem 0.6rem 0.4rem',
              }}
            >
              OPERATIONS
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/scm/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#4f46e5' : '#475569',
                    backgroundColor: isActive ? '#ede9fe' : 'transparent',
                    transition: 'all 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ color: isActive ? '#4f46e5' : '#64748b', display: 'flex' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Bottom: User / Workspace mini card */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderTop: '1px solid #f1f5f9',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.5rem',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'background-color 120ms ease',
              }}
              onClick={handleLogout}
              title="Click to logout"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#e0e7ff',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 650,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {userInitial}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Urgent Manpower
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {username}
                  </div>
                </div>
              </div>
              <IconChevronRight size={14} color="#94a3b8" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflowX: 'hidden',
          }}
        >
          {/* Top Header Bar */}
          <header
            style={{
              height: '62px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 2rem',
              position: 'sticky',
              top: 0,
              zIndex: 30,
              gap: '1.5rem',
            }}
          >
            {/* Left: Top Workspace Selector */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <WorkspaceSelector currentWorkspaceId={auth?.workspaceId} />
            </div>

            {/* Center: Global Search Input */}
            <div style={{ flex: 1, maxWidth: '520px', minWidth: '240px' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e8ecf2',
                  borderRadius: '12px',
                  padding: '0.45rem 0.85rem',
                  gap: '0.55rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <IconSearch size={16} color="#94a3b8" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items, employees, kits, allocations..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.8rem',
                    color: '#0f172a',
                    width: '100%',
                    fontFamily: 'inherit',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#64748b',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.12rem 0.4rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    flexShrink: 0,
                  }}
                >
                  ⌘K
                </span>
              </div>
            </div>

            {/* Right: Notifications & User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
              {/* Notification Bell Button */}
              <button
                type="button"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #e8ecf2',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#e8ecf2';
                }}
              >
                <IconBell size={17} />
              </button>

              {/* User Profile Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {userInitial}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      lineHeight: 1.2,
                    }}
                  >
                    {username}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                    Workspace Admin
                  </span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.38rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 550,
                  color: '#ef4444',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fecaca',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                  e.currentTarget.style.borderColor = '#fca5a5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#fecaca';
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </header>

          {/* Page View Body */}
          <main style={{ flex: 1, padding: '1rem 1.5rem', overflowY: 'auto' }}>{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
