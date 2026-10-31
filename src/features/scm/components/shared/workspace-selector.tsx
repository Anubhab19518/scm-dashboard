'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WorkspaceOption } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { AuthSession } from '../../services/auth-session';
import { IconBuilding, IconChevronDown, IconCheck, IconPlus, IconX } from './scm-icons';

interface WorkspaceSelectorProps {
  currentWorkspaceId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
}

export function WorkspaceSelector({
  currentWorkspaceId,
  onWorkspaceChange,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [activeId, setActiveId] = useState<string>(currentWorkspaceId || '');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    // Small delay to ensure tokens are written to localStorage after login navigation
    const timer = setTimeout(async () => {
      try {
        // Only attempt fetch if we have a valid access token
        const token =
          localStorage.getItem('accessToken') || localStorage.getItem('scm_access_token');
        if (!token) return;

        const list = await ScmApiService.listWorkspaces();
        if (isMounted && list.length > 0) {
          setWorkspaces(list);

          const stored = AuthSession.getStoredAuth();
          const currentId = currentWorkspaceId || stored.workspaceId;
          const exists = list.some((w) => w.id.toLowerCase() === currentId.toLowerCase());

          if (!exists || currentId.startsWith('00000000-0000-0000-0000-00000000000')) {
            const defaultWs = list.find((w) => w.name.toLowerCase().includes('urgent')) || list[0];
            if (defaultWs) {
              setActiveId(defaultWs.id);
              localStorage.setItem('activeWorkspaceId', defaultWs.id);
              localStorage.setItem('activeWorkspaceName', defaultWs.name);
              AuthSession.updateWorkspaceId(defaultWs.id);
            }
          } else {
            // Save current workspace name for fallback display
            const currentWs = list.find((w) => w.id.toLowerCase() === currentId.toLowerCase());
            if (currentWs) {
              localStorage.setItem('activeWorkspaceName', currentWs.name);
            }
          }
        }
      } catch {
        // Workspace fetch failed — will show fallback workspace display
      }
    }, 200); // 200ms delay ensures tokens are stored after login redirect

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (currentWorkspaceId) {
      setActiveId(currentWorkspaceId);
    } else {
      const stored = AuthSession.getStoredAuth();
      if (stored.workspaceId) {
        setActiveId(stored.workspaceId);
      }
    }
  }, [currentWorkspaceId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Build a meaningful fallback name from stored auth data
  const fallbackWorkspaceName = (() => {
    if (!activeId) return 'Select Workspace';
    const stored = AuthSession.getStoredAuth();
    // Try to get workspace name from stored user data
    const userName = stored.user?.firstName
      ? `${stored.user.firstName}'s Workspace`
      : stored.user?.email?.split('@')[0] || null;
    // Try localStorage
    const storedWsName =
      typeof window !== 'undefined' ? localStorage.getItem('activeWorkspaceName') : null;
    return storedWsName || userName || 'Urgent Manpower';
  })();

  const activeWorkspace = workspaces.find((w) => w.id.toLowerCase() === activeId.toLowerCase()) || {
    id: activeId,
    name: fallbackWorkspaceName,
    code: undefined,
    location: undefined,
  };

  const handleSelectWorkspace = (ws: WorkspaceOption) => {
    setActiveId(ws.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeWorkspaceId', ws.id);
    }
    AuthSession.updateWorkspaceId(ws.id);
    setIsOpen(false);
    if (onWorkspaceChange) {
      onWorkspaceChange(ws.id);
    }
    window.location.reload();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const newId = customInput.trim();
    setActiveId(newId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeWorkspaceId', newId);
    }
    AuthSession.updateWorkspaceId(newId);
    setIsOpen(false);
    setShowCustomInput(false);
    if (onWorkspaceChange) {
      onWorkspaceChange(newId);
    }
    window.location.reload();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Top Bar Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.42rem 0.8rem',
          backgroundColor: isOpen ? '#f1f5f9' : '#ffffff',
          border: '1px solid #e8ecf2',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 120ms ease',
          textAlign: 'left',
          fontSize: '0.8rem',
          color: '#334155',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isOpen ? '#f1f5f9' : '#ffffff';
          e.currentTarget.style.borderColor = '#e8ecf2';
        }}
      >
        <div
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            backgroundColor: '#eff6ff',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconBuilding size={13} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>Workspace:</span>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#0f172a',
              maxWidth: '240px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeWorkspace.name}
          </span>
        </div>

        <IconChevronDown
          size={13}
          color="#64748b"
          style={{
            marginLeft: '0.2rem',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms ease',
          }}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '320px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e8ecf2',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.65rem 0.85rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#64748b',
                }}
              >
                Select Active Workspace
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
                Fetched from enterprise database
              </div>
            </div>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#3b82f6',
                backgroundColor: '#eff6ff',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
              }}
            >
              {workspaces.length} Available
            </span>
          </div>

          {/* List of Workspaces */}
          <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '0.35rem' }}>
            {workspaces.length === 0 ? (
              <div
                style={{
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                  color: '#64748b',
                  textAlign: 'center',
                }}
              >
                No workspaces returned from database.
              </div>
            ) : (
              workspaces.map((ws) => {
                const isSelected = ws.id.toLowerCase() === activeId.toLowerCase();
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => handleSelectWorkspace(ws)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.65rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 100ms ease',
                      marginBottom: '0.15rem',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '5px',
                          backgroundColor: isSelected ? '#3b82f6' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconBuilding size={13} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? '#1d4ed8' : '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ws.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: '#64748b',
                            display: 'flex',
                            gap: '0.35rem',
                          }}
                        >
                          {ws.code && <span>{ws.code}</span>}
                          {ws.location && <span>• {ws.location}</span>}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{ color: '#2563eb', flexShrink: 0, marginLeft: '0.5rem' }}>
                        <IconCheck size={14} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Custom Workspace UUID Accordion */}
          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              padding: '0.45rem 0.65rem',
              backgroundColor: '#f8fafc',
            }}
          >
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.45rem',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: '#4f46e5',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#eef2ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <IconPlus size={13} />
                <span>Enter Custom Workspace UUID</span>
              </button>
            ) : (
              <form
                onSubmit={handleCustomSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <label
                    htmlFor="custom-workspace-id"
                    style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569' }}
                  >
                    Custom Workspace ID (UUID):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <IconX size={12} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <input
                    id="custom-workspace-id"
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="00000000-0000-0000-..."
                    style={{
                      flex: 1,
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.72rem',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Apply
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
