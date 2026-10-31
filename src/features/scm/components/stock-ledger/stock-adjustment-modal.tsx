'use client';

import React, { useState, useEffect } from 'react';
import { Item, StockTransactionType } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { stockAdjustmentSchema } from '../../schemas/scm.schemas';
import { useToast } from '../shared/toast-provider';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  item: Item | null;
  allItems?: Item[];
  onClose: () => void;
  onSuccess: () => void;
}

const REFERENCE_TYPES = [
  { value: 'PURCHASE_ORDER', label: 'Purchase Order Inward Receipt' },
  { value: 'AUDIT_CORRECTION', label: 'Physical Audit Count Correction' },
  { value: 'DAMAGE_WRITE_OFF', label: 'Damaged / Expired Write-Off' },
  { value: 'VENDOR_RETURN', label: 'Return to Vendor' },
  { value: 'INTERNAL_TRANSFER', label: 'Internal Store Transfer' },
  { value: 'OTHER', label: 'Other Movement' },
];

export function StockAdjustmentModal({
  isOpen,
  item,
  allItems = [],
  onClose,
  onSuccess,
}: StockAdjustmentModalProps) {
  const { showToast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [deltaMode, setDeltaMode] = useState<'INWARD' | 'OUTWARD'>('INWARD');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState('');
  const [referenceType, setReferenceType] = useState('PURCHASE_ORDER');
  const [referenceId, setReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setSelectedItemId(item.id);
    } else if (allItems.length > 0 && !selectedItemId) {
      setSelectedItemId(allItems[0]?.id || '');
    }
    setQuantity(10);
    setReason('');
    setReferenceId('');
  }, [item, allItems, isOpen, selectedItemId]);

  const activeItem = item || allItems.find((i) => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId && !item) {
      showToast('Please select an item to adjust', 'warning');
      return;
    }

    const targetId = item ? item.id : selectedItemId;
    const finalDelta = deltaMode === 'INWARD' ? Math.abs(quantity) : -Math.abs(quantity);

    if (finalDelta === 0) {
      showToast('Quantity cannot be zero', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = stockAdjustmentSchema.parse({
        transactionType: StockTransactionType.STOCK_ADJUSTMENT,
        quantityDelta: finalDelta,
        reason: reason.trim(),
        referenceType: referenceType || undefined,
        referenceId: referenceId.trim() || undefined,
      });

      await ScmApiService.adjustStock(targetId, payload);
      showToast(
        `Stock adjusted successfully (${finalDelta > 0 ? `+${finalDelta}` : finalDelta} ${activeItem?.unit || 'units'})`,
        'success',
      );
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Stock adjustment failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: '520px',
          backgroundColor: 'hsl(var(--bg-secondary))',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid hsl(var(--border-subtle))',
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
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Stock Adjustment & Inward Receipt
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem', margin: 0 }}>
              Records an authoritative double-entry transaction in the stock ledger.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: 'hsl(var(--text-muted))', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* Target Item */}
          {item ? (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'hsl(var(--bg-surface) / 0.6)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid hsl(var(--border-subtle))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'hsl(var(--color-brand-accent))',
                    fontWeight: 700,
                    fontFamily: 'var(--font-family-mono)',
                  }}
                >
                  {item.itemCode}
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  {item.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                  Current Balance
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  {item.currentStock} {item.unit}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--text-secondary))',
                  marginBottom: '0.25rem',
                }}
              >
                Select Target Item *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                  border: '1px solid hsl(var(--border-subtle))',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {allItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    [{i.itemCode}] {i.name} — Current: {i.currentStock} {i.unit}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Movement Type Toggle */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'hsl(var(--text-secondary))',
                marginBottom: '0.4rem',
              }}
            >
              Adjustment Direction *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeltaMode('INWARD')}
                style={{
                  padding: '0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border:
                    deltaMode === 'INWARD'
                      ? '2px solid hsl(var(--color-success))'
                      : '1px solid hsl(var(--border-subtle))',
                  backgroundColor:
                    deltaMode === 'INWARD'
                      ? 'hsl(var(--color-success-bg))'
                      : 'hsl(var(--bg-surface) / 0.5)',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: deltaMode === 'INWARD' ? 'hsl(var(--color-success))' : '#ffffff',
                  }}
                >
                  📥 + Inward Receipt (Stock Add)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeltaMode('OUTWARD')}
                style={{
                  padding: '0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border:
                    deltaMode === 'OUTWARD'
                      ? '2px solid hsl(var(--color-danger))'
                      : '1px solid hsl(var(--border-subtle))',
                  backgroundColor:
                    deltaMode === 'OUTWARD'
                      ? 'hsl(var(--color-danger-bg))'
                      : 'hsl(var(--bg-surface) / 0.5)',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: deltaMode === 'OUTWARD' ? 'hsl(var(--color-danger))' : '#ffffff',
                  }}
                >
                  📤 - Outward / Loss / Scrap
                </div>
              </button>
            </div>
          </div>

          {/* Quantity Delta */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'hsl(var(--text-secondary))',
                marginBottom: '0.25rem',
              }}
            >
              Quantity ({deltaMode === 'INWARD' ? 'To Add (+)' : 'To Deduct (-)'}) *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              required
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                border: '1px solid hsl(var(--border-subtle))',
                color:
                  deltaMode === 'INWARD' ? 'hsl(var(--color-success))' : 'hsl(var(--color-danger))',
              }}
            />
          </div>

          {/* Reason */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'hsl(var(--text-secondary))',
                marginBottom: '0.25rem',
              }}
            >
              Reason for Adjustment *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received batch PO-2026-8891 from vendor"
              required
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                border: '1px solid hsl(var(--border-subtle))',
                color: 'hsl(var(--text-primary))',
              }}
            />
          </div>

          {/* Reference Type & ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--text-secondary))',
                  marginBottom: '0.25rem',
                }}
              >
                Reference Type
              </label>
              <select
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.825rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                  border: '1px solid hsl(var(--border-subtle))',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {REFERENCE_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
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
                Reference ID / PO #
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. PO-2026-8891"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                  border: '1px solid hsl(var(--border-subtle))',
                  color: 'hsl(var(--text-primary))',
                }}
              />
            </div>
          </div>

          {/* Actions */}
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                backgroundColor:
                  deltaMode === 'INWARD' ? 'hsl(var(--color-success))' : 'hsl(var(--color-danger))',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Posting Ledger...' : 'Post Adjustment to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
