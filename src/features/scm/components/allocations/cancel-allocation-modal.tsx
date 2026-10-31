'use client';

import React, { useState } from 'react';
import { Allocation } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { cancelAllocationSchema } from '../../schemas/scm.schemas';
import { useToast } from '../shared/toast-provider';

interface CancelAllocationModalProps {
  isOpen: boolean;
  allocation: Allocation | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelAllocationModal({
  isOpen,
  allocation,
  onClose,
  onSuccess,
}: CancelAllocationModalProps) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !allocation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please provide a reason for cancelling this allocation', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = cancelAllocationSchema.parse({ reason: reason.trim() });
      await ScmApiService.cancelAllocation(allocation.id, payload);
      showToast(
        `Allocation ${allocation.allocationNumber || ''} cancelled. Inventory has been credited back to stock ledger.`,
        'success',
      );
      setReason('');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to cancel allocation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9996,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'hsl(var(--bg-overlay))',
        backdropFilter: 'blur(8px)',
        padding: '1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'hsl(var(--bg-secondary))',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid hsl(var(--color-danger) / 0.4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Cancel Allocation & Restock
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: 'hsl(var(--text-muted))', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div
            style={{
              padding: '0.85rem',
              backgroundColor: 'hsl(var(--color-danger-bg))',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--color-danger) / 0.3)',
              fontSize: '0.825rem',
              color: 'hsl(var(--text-primary))',
              lineHeight: 1.4,
            }}
          >
            <strong>Automatic Stock Reversal:</strong> Cancelling allocation{' '}
            <strong>{allocation.allocationNumber || allocation.id.slice(0, 8)}</strong> for{' '}
            <strong>{allocation.employeeName || 'Employee'}</strong> will immediately credit all
            bundled kit items back into the inventory stock ledger with an{' '}
            <code>ALLOCATION_REVERSAL</code> entry.
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'hsl(var(--text-secondary))',
                marginBottom: '0.25rem',
              }}
            >
              Cancellation Reason *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Deployment postponed, equipment returned to store in clean condition"
              required
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                border: '1px solid hsl(var(--border-subtle))',
                color: 'hsl(var(--text-primary))',
                resize: 'none',
              }}
            />
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid hsl(var(--border-subtle))',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.825rem',
                color: 'hsl(var(--text-secondary))',
                backgroundColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                backgroundColor: 'hsl(var(--color-danger))',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation & Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
