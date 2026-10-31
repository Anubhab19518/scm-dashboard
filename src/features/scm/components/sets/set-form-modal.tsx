'use client';

import React, { useState, useEffect } from 'react';
import { ItemSet, Item } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { createSetSchema, updateSetSchema } from '../../schemas/scm.schemas';
import { useToast } from '../shared/toast-provider';

interface SetFormModalProps {
  isOpen: boolean;
  set?: ItemSet | null;
  items: Item[];
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedItemRow {
  itemId: string;
  quantity: number;
}

export function SetFormModal({ isOpen, set, items, onClose, onSuccess }: SetFormModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [setCode, setSetCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItemRow[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (set) {
      setSetCode(set.setCode);
      setName(set.name);
      setDescription(set.description || '');
      setTargetRole(set.targetRole || '');
      setTargetDepartment(set.targetDepartment || '');
      setIsActive(set.isActive);
      if (set.items && set.items.length > 0) {
        setSelectedItems(
          set.items.map((it) => ({
            itemId: it.itemId,
            quantity: it.quantity,
          })),
        );
      } else {
        setSelectedItems(items[0] ? [{ itemId: items[0].id, quantity: 1 }] : []);
      }
    } else {
      setSetCode('');
      setName('');
      setDescription('');
      setTargetRole('');
      setTargetDepartment('');
      setIsActive(true);
      setSelectedItems(items[0] ? [{ itemId: items[0].id, quantity: 1 }] : []);
    }
  }, [set, items, isOpen]);

  const handleAddItemRow = () => {
    if (items.length === 0) return;
    setSelectedItems((prev) => [...prev, { itemId: items[0]?.id || '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (selectedItems.length <= 1) {
      showToast('A Kit must contain at least one item', 'warning');
      return;
    }
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemRow = (
    index: number,
    field: 'itemId' | 'quantity',
    value: string | number,
  ) => {
    setSelectedItems((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      showToast('Please add at least one item to this kit', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (set) {
        const payload = updateSetSchema.parse({
          name: name.trim(),
          description: description.trim() || undefined,
          targetRole: targetRole.trim() || undefined,
          targetDepartment: targetDepartment.trim() || undefined,
          items: selectedItems.map((s) => ({ itemId: s.itemId, quantity: Number(s.quantity) })),
          isActive,
        });

        await ScmApiService.updateSet(set.id, payload);
        showToast('Kit configuration updated successfully', 'success');
      } else {
        const payload = createSetSchema.parse({
          setCode: setCode.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          targetRole: targetRole.trim() || undefined,
          targetDepartment: targetDepartment.trim() || undefined,
          items: selectedItems.map((s) => ({ itemId: s.itemId, quantity: Number(s.quantity) })),
          isActive,
        });

        await ScmApiService.createSet(payload);
        showToast('Standard Kit/Set created successfully', 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Kit validation failed', 'error');
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
        zIndex: 9995,
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
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
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
              {set ? 'Edit Standard Set / Kit' : 'Configure Standard Set / Kit'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem', margin: 0 }}>
              Standardized gear bundles mapped to specific workforce designations.
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Set Code & Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--text-secondary))',
                  marginBottom: '0.25rem',
                }}
              >
                Set Code *
              </label>
              <input
                type="text"
                disabled={Boolean(set)}
                value={setCode}
                onChange={(e) => setSetCode(e.target.value)}
                placeholder="e.g. KIT-SEC-GUARD"
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                  border: '1px solid hsl(var(--border-subtle))',
                  color: 'hsl(var(--text-primary))',
                  fontFamily: 'var(--font-family-mono)',
                }}
              />
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
                Set Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Security Guard Deployment Kit"
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
          </div>

          {/* Target Role & Department */}
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
                Target Designation / Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Security Guard, Supervisor"
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

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--text-secondary))',
                  marginBottom: '0.25rem',
                }}
              >
                Target Department
              </label>
              <input
                type="text"
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                placeholder="e.g. Security Operations"
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

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'hsl(var(--text-secondary))',
                marginBottom: '0.25rem',
              }}
            >
              Kit Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Standard equipment package provided to employees upon onboarding/deployment"
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

          {/* Bundled Items Configurator */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'hsl(var(--bg-surface) / 0.4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <span
                style={{ fontSize: '0.825rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}
              >
                Bundled Items & Quantities ({selectedItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'hsl(var(--color-brand-accent))',
                  backgroundColor: 'hsl(var(--bg-surface))',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border-subtle))',
                  cursor: 'pointer',
                }}
              >
                + Add Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedItems.map((row, idx) => {
                const targetItem = items.find((i) => i.id === row.itemId);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 90px 32px',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <select
                      value={row.itemId}
                      onChange={(e) => handleUpdateItemRow(idx, 'itemId', e.target.value)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'hsl(var(--bg-secondary))',
                        border: '1px solid hsl(var(--border-subtle))',
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          [{i.itemCode}] {i.name} (Stock: {i.currentStock} {i.unit})
                        </option>
                      ))}
                    </select>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          handleUpdateItemRow(idx, 'quantity', Math.max(1, Number(e.target.value)))
                        }
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.5rem',
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'hsl(var(--bg-secondary))',
                          border: '1px solid hsl(var(--border-subtle))',
                          color: '#ffffff',
                          textAlign: 'center',
                        }}
                      />
                      {targetItem && (
                        <span
                          style={{
                            position: 'absolute',
                            right: '6px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '0.65rem',
                            color: 'hsl(var(--text-muted))',
                            pointerEvents: 'none',
                          }}
                        >
                          {targetItem.unit}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      style={{
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'hsl(var(--color-danger))',
                        backgroundColor: 'hsl(var(--bg-secondary))',
                        border: '1px solid hsl(var(--border-subtle))',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                backgroundColor: 'hsl(var(--color-brand-accent))',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 2px 8px hsl(var(--color-brand-accent) / 0.3)',
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Saving...' : set ? 'Save Changes' : 'Create Set Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
