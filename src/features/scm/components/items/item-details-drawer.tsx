'use client';

import { useEffect, useState, useCallback } from 'react';
import { Item, StockLedgerEntry } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { StatusBadge } from '../shared/status-badge';
import { useToast } from '../shared/toast-provider';

interface ItemDetailsDrawerProps {
  itemId: string | null;
  onClose: () => void;
  onAdjustStock: (item: Item) => void;
  onEdit: (item: Item) => void;
}

export function ItemDetailsDrawer({
  itemId,
  onClose,
  onAdjustStock,
  onEdit,
}: ItemDetailsDrawerProps) {
  const { showToast } = useToast();
  const [item, setItem] = useState<Item | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadItemDetails = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const [itemData, ledgerData] = await Promise.all([
          ScmApiService.getItem(id),
          ScmApiService.listStockLedger({ itemId: id, limit: 20 }),
        ]);
        setItem(itemData);
        setLedgerEntries(ledgerData.entries);
      } catch {
        showToast('Failed to load item audit history', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    if (itemId) {
      loadItemDetails(itemId);
    } else {
      setItem(null);
      setLedgerEntries([]);
    }
  }, [itemId, loadItemDetails]);

  if (!itemId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'hsl(var(--bg-overlay))',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          height: '100%',
          backgroundColor: 'hsl(var(--bg-secondary))',
          borderLeft: '1px solid hsl(var(--border-subtle))',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideLeft 250ms ease-out',
        }}
      >
        {/* Drawer Header */}
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
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-family-mono)',
                color: 'hsl(var(--color-brand-accent))',
                fontWeight: 700,
              }}
            >
              {item?.itemCode || 'ITEM AUDIT'}
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
              {item?.name || 'Loading item...'}
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

        {/* Drawer Body */}
        <div
          style={{
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              Fetching audit ledger...
            </div>
          ) : item ? (
            <>
              {/* Item Info Summary Card */}
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'hsl(var(--bg-surface) / 0.5)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border-subtle))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <StatusBadge status={item.trackingType} />
                      <StatusBadge stock={item.currentStock} reorderLevel={item.reorderLevel} />
                    </div>
                    {item.category && (
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                        Category:{' '}
                        <strong style={{ color: 'hsl(var(--text-primary))' }}>
                          {item.category.name}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {item.currentStock}{' '}
                      <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                        {item.unit}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-secondary))' }}>
                      Reorder Trigger: {item.reorderLevel} {item.unit}
                    </div>
                  </div>
                </div>

                {item.description && (
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'hsl(var(--text-secondary))',
                      lineHeight: 1.4,
                      borderTop: '1px solid hsl(var(--border-subtle))',
                      paddingTop: '0.75rem',
                      margin: 0,
                    }}
                  >
                    {item.description}
                  </p>
                )}

                {/* Quick actions on this item */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    borderTop: '1px solid hsl(var(--border-subtle))',
                    paddingTop: '0.75rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onAdjustStock(item)}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      backgroundColor: 'hsl(var(--color-brand-accent))',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Stock Adjustment
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      backgroundColor: 'hsl(var(--bg-surface-hover))',
                      border: '1px solid hsl(var(--border-subtle))',
                      color: 'hsl(var(--text-primary))',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    Edit Item
                  </button>
                </div>
              </div>

              {/* Item Specific Stock Ledger */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    Movement & Ledger Audit ({ledgerEntries.length})
                  </h3>
                </div>

                {ledgerEntries.length === 0 ? (
                  <div
                    style={{
                      padding: '1.5rem',
                      textAlign: 'center',
                      color: 'hsl(var(--text-muted))',
                      fontSize: '0.8rem',
                    }}
                  >
                    No stock ledger transactions recorded for this item yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ledgerEntries.map((entry) => {
                      const isPositive = entry.quantityDelta > 0;
                      return (
                        <div
                          key={entry.id}
                          style={{
                            padding: '0.75rem',
                            backgroundColor: 'hsl(var(--bg-surface) / 0.3)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid hsl(var(--border-subtle))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                marginBottom: '0.2rem',
                              }}
                            >
                              <StatusBadge status={entry.transactionType} />
                              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                                {new Date(entry.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div
                              style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}
                            >
                              {entry.reason || entry.referenceType || 'Inventory transaction'}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: isPositive
                                  ? 'hsl(var(--color-success))'
                                  : 'hsl(var(--color-danger))',
                              }}
                            >
                              {isPositive ? `+${entry.quantityDelta}` : entry.quantityDelta}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))' }}>
                              Balance: {entry.balanceAfter}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
