'use client';

import React, { useState, useEffect } from 'react';
import { Item, ItemCategory, TrackingType } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { createItemSchema, updateItemSchema } from '../../schemas/scm.schemas';
import { useToast } from '../shared/toast-provider';

interface ItemFormModalProps {
  isOpen: boolean;
  item?: Item | null;
  categories: ItemCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

const UNITS = ['PCS', 'PAIR', 'BOX', 'SET', 'PACK', 'ROLL', 'MTR', 'KG', 'UNIT'];

export function ItemFormModal({
  isOpen,
  item,
  categories,
  onClose,
  onSuccess,
}: ItemFormModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fields
  const [itemCode, setItemCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [trackingType, setTrackingType] = useState<TrackingType>(TrackingType.TRACKED);
  const [reorderLevel, setReorderLevel] = useState<number>(15);
  const [initialStock, setInitialStock] = useState<number>(50);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (item) {
      setItemCode(item.itemCode);
      setName(item.name);
      setDescription(item.description || '');
      setCategoryId(item.categoryId || '');
      setUnit(item.unit || 'PCS');
      setTrackingType(item.trackingType);
      setReorderLevel(item.reorderLevel);
      setIsActive(item.isActive);
    } else {
      setItemCode('');
      setName('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setUnit('PCS');
      setTrackingType(TrackingType.TRACKED);
      setReorderLevel(15);
      setInitialStock(50);
      setIsActive(true);
    }
  }, [item, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (item) {
        // Update mode
        const payload = updateItemSchema.parse({
          name: name.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          unit,
          trackingType,
          reorderLevel: Number(reorderLevel),
          isActive,
        });

        await ScmApiService.updateItem(item.id, payload);
        showToast('Item updated successfully', 'success');
      } else {
        // Create mode
        const payload = createItemSchema.parse({
          itemCode: itemCode.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          unit,
          trackingType,
          reorderLevel: Number(reorderLevel),
          initialStock: Number(initialStock),
          isActive,
        });

        await ScmApiService.createItem(payload);
        showToast('Item created successfully with initial stock ledger entry', 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Validation failed', 'error');
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
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'hsl(var(--bg-secondary))',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid hsl(var(--border-subtle))',
        }}
      >
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
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
              {item ? 'Edit Catalog Item' : 'New Inventory Item'}
            </h2>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'hsl(var(--text-secondary))',
                marginTop: '0.15rem',
              }}
            >
              Define equipment specifications, tracking type, and reorder triggers.
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
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Code & Name */}
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
                Item Code *
              </label>
              <input
                type="text"
                disabled={Boolean(item)}
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="e.g. PPE-HELM-01"
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
                Item Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Industrial Safety Helmet (Yellow)"
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

          {/* Category & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--text-secondary))',
                  marginBottom: '0.25rem',
                }}
              >
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
                <option value="">-- No Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
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
                Unit of Measure *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
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
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tracking Type */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'hsl(var(--text-secondary))',
                marginBottom: '0.4rem',
              }}
            >
              Tracking Classification *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setTrackingType(TrackingType.TRACKED)}
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  border:
                    trackingType === TrackingType.TRACKED
                      ? '1.5px solid #4f46e5'
                      : '1px solid #e2e8f0',
                  backgroundColor: trackingType === TrackingType.TRACKED ? '#eff6ff' : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: '#2563eb' }}>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                    Tracked Asset
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Reusable gear (Boots, Helmets, Radios, Bodycams)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTrackingType(TrackingType.CONSUMABLE)}
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  border:
                    trackingType === TrackingType.CONSUMABLE
                      ? '1.5px solid #4f46e5'
                      : '1px solid #e2e8f0',
                  backgroundColor: trackingType === TrackingType.CONSUMABLE ? '#eff6ff' : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: '#2563eb' }}>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    </svg>
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                    Consumable
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Disposable supply (Gloves, Masks, Badges)
                </div>
              </button>
            </div>
          </div>

          {/* Reorder Level & Initial Stock */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: item ? '1fr' : '1fr 1fr',
              gap: '0.75rem',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--text-secondary))',
                  marginBottom: '0.25rem',
                }}
              >
                Reorder Level (Alert Threshold) *
              </label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
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

            {!item && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'hsl(var(--text-secondary))',
                    marginBottom: '0.25rem',
                  }}
                >
                  Opening Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(Number(e.target.value))}
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
            )}
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
              Item Description & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specs, supplier details, or sizing information"
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

          {/* Footer Action Buttons */}
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
              {isSubmitting ? 'Saving...' : item ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
