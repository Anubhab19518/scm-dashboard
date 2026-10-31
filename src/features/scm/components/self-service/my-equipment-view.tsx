'use client';

import { useState, useEffect, useCallback } from 'react';
import { Allocation, AllocationStatus } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { StatusBadge } from '../shared/status-badge';
import { useToast } from '../shared/toast-provider';
import { IconShield, IconAlertTriangle, IconCheckCircle } from '../shared/scm-icons';

export function MyEquipmentView() {
  const { showToast } = useToast();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingId, setIsConfirmingId] = useState<string | null>(null);

  const loadMyAllocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ScmApiService.listMyAllocations();
      setAllocations(data);
    } catch {
      showToast('Could not load your equipment assignments.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMyAllocations();
  }, [loadMyAllocations]);

  const handleAcknowledge = async (allocationId: string) => {
    setIsConfirmingId(allocationId);
    try {
      await ScmApiService.receiveMyAllocation(allocationId);
      showToast('Equipment physical receipt successfully acknowledged!', 'success');
      loadMyAllocations();
    } catch {
      showToast('Failed to acknowledge equipment receipt. Please retry.', 'error');
    } finally {
      setIsConfirmingId(null);
    }
  };

  const pendingCount = allocations.filter((a) => a.status === AllocationStatus.ALLOCATED).length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        maxWidth: '840px',
        margin: '0 auto',
        fontFamily: 'var(--font-family-sans)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}
          >
            <h1 style={{ fontSize: '1.35rem', fontWeight: 650, color: '#0f172a', margin: 0 }}>
              My Assigned Equipment & PPE
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Employee Self-Service: Review your allocated kits, uniform items, and acknowledge
            physical receipt.
          </p>
        </div>

        {pendingCount > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#d97706',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <IconAlertTriangle size={14} color="#d97706" />
            <span>{pendingCount} Pending Confirmation(s)</span>
          </div>
        )}
      </div>

      {/* Equipment Allocation Cards List */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Loading your assigned equipment...
        </div>
      ) : allocations.length === 0 ? (
        <div
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <IconShield size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 650, color: '#0f172a', margin: 0 }}>
            No Equipment Currently Assigned
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            When your supervisor or SCM manager dispatches a kit or PPE gear, it will appear here
            for acknowledgement.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {allocations.map((alloc) => {
            const isPending = alloc.status === AllocationStatus.ALLOCATED;

            return (
              <div
                key={alloc.id}
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: isPending ? '1px solid #fde68a' : '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600 }}>
                        {alloc.allocationNumber || `ALC-${alloc.id.slice(0, 8)}`}
                      </span>
                      <StatusBadge status={alloc.status} />
                    </div>
                    <h2
                      style={{
                        fontSize: '1rem',
                        fontWeight: 650,
                        color: '#0f172a',
                        marginTop: '0.2rem',
                        margin: '0.2rem 0 0 0',
                      }}
                    >
                      {alloc.setName || 'Assigned Equipment Set'}
                    </h2>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Issued:{' '}
                      {alloc.allocatedAt
                        ? new Date(alloc.allocatedAt).toLocaleDateString()
                        : 'Recent'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                      Quantity:{' '}
                      <strong style={{ color: '#0f172a' }}>{alloc.setQuantity} set(s)</strong>
                    </div>
                  </div>
                </div>

                {/* Items Included inside this bundle */}
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      color: '#64748b',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Items & Gear In This Kit
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '0.4rem',
                    }}
                  >
                    {alloc.items?.map((it) => (
                      <div
                        key={it.id}
                        style={{
                          padding: '0.5rem 0.65rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                            {it.itemName}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{it.itemCode}</div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 650,
                              color: '#4f46e5',
                            }}
                          >
                            {it.quantity} {it.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes if any */}
                {alloc.notes && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#475569',
                      backgroundColor: '#f8fafc',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <strong>Dispatch Note:</strong> {alloc.notes}
                  </div>
                )}

                {/* Acknowledgement Action Button */}
                {isPending && (
                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <IconAlertTriangle size={14} color="#d97706" />
                      <span>
                        Physical gear dispatched. Please confirm you have inspected and received the
                        items.
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isConfirmingId === alloc.id}
                      onClick={() => handleAcknowledge(alloc.id)}
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: isConfirmingId === alloc.id ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <IconCheckCircle size={14} color="#ffffff" />
                      <span>
                        {isConfirmingId === alloc.id
                          ? 'Confirming...'
                          : 'Acknowledge Physical Receipt'}
                      </span>
                    </button>
                  </div>
                )}

                {!isPending && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.75rem',
                      color: '#16a34a',
                      fontWeight: 500,
                    }}
                  >
                    <IconCheckCircle size={14} color="#16a34a" />
                    <span>Physical receipt acknowledged and verified.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
