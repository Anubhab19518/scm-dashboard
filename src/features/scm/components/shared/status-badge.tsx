import { TrackingType, AllocationStatus, StockTransactionType } from '../../types';

interface StatusBadgeProps {
  status?: string | AllocationStatus | TrackingType | StockTransactionType;
  type?: 'allocation' | 'tracking' | 'stock' | 'transaction';
  stock?: number;
  reorderLevel?: number;
}

export function StatusBadge({ status, type, stock, reorderLevel }: StatusBadgeProps) {
  // Stock alert level calculation
  if (type === 'stock' || (stock !== undefined && reorderLevel !== undefined)) {
    const isOut = (stock ?? 0) <= 0;
    const isLow = (stock ?? 0) <= (reorderLevel ?? 0);

    if (isOut) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.15rem 0.45rem',
            fontSize: '0.72rem',
            fontWeight: 500,
            borderRadius: '9999px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
          }}
        >
          <span
            style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#dc2626' }}
          />
          Out of Stock
        </span>
      );
    }

    if (isLow) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.15rem 0.45rem',
            fontSize: '0.72rem',
            fontWeight: 500,
            borderRadius: '9999px',
            backgroundColor: '#fffbeb',
            color: '#d97706',
            border: '1px solid #fde68a',
          }}
        >
          <span
            style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#d97706' }}
          />
          Low Stock
        </span>
      );
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.15rem 0.45rem',
          fontSize: '0.72rem',
          fontWeight: 500,
          borderRadius: '9999px',
          backgroundColor: '#f0fdf4',
          color: '#16a34a',
          border: '1px solid #bbf7d0',
        }}
      >
        <span
          style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#16a34a' }}
        />
        Optimal
      </span>
    );
  }

  // Allocation Status
  if (status === AllocationStatus.ALLOCATED || status === 'ALLOCATED') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.15rem 0.5rem',
          fontSize: '0.72rem',
          fontWeight: 500,
          borderRadius: '9999px',
          backgroundColor: '#fffbeb',
          color: '#d97706',
          border: '1px solid #fde68a',
        }}
      >
        <span
          style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#d97706' }}
        />
        Pending Receipt
      </span>
    );
  }

  if (status === AllocationStatus.RECEIVED || status === 'RECEIVED') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.15rem 0.5rem',
          fontSize: '0.72rem',
          fontWeight: 500,
          borderRadius: '9999px',
          backgroundColor: '#f0fdf4',
          color: '#16a34a',
          border: '1px solid #bbf7d0',
        }}
      >
        <span
          style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#16a34a' }}
        />
        Received & Verified
      </span>
    );
  }

  if (status === AllocationStatus.CANCELLED || status === 'CANCELLED') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.15rem 0.5rem',
          fontSize: '0.72rem',
          fontWeight: 500,
          borderRadius: '9999px',
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          border: '1px solid #e2e8f0',
        }}
      >
        <span
          style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#64748b' }}
        />
        Cancelled
      </span>
    );
  }

  // Tracking Type
  if (status === TrackingType.TRACKED || status === 'TRACKED') {
    return (
      <span
        style={{
          display: 'inline-flex',
          padding: '0.15rem 0.45rem',
          fontSize: '0.7rem',
          fontWeight: 600,
          borderRadius: '4px',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          border: '1px solid #dbeafe',
        }}
      >
        Tracked Asset
      </span>
    );
  }

  if (status === TrackingType.CONSUMABLE || status === 'CONSUMABLE') {
    return (
      <span
        style={{
          display: 'inline-flex',
          padding: '0.15rem 0.45rem',
          fontSize: '0.7rem',
          fontWeight: 500,
          borderRadius: '4px',
          backgroundColor: '#f8fafc',
          color: '#475569',
          border: '1px solid #e2e8f0',
        }}
      >
        Consumable
      </span>
    );
  }

  // Transaction Types
  if (status === StockTransactionType.OPENING_STOCK || status === 'OPENING_STOCK') {
    return (
      <span
        style={{
          display: 'inline-flex',
          padding: '0.15rem 0.45rem',
          fontSize: '0.7rem',
          fontWeight: 500,
          borderRadius: '4px',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          border: '1px solid #dbeafe',
        }}
      >
        Opening Stock
      </span>
    );
  }

  if (status === StockTransactionType.STOCK_ADJUSTMENT || status === 'STOCK_ADJUSTMENT') {
    return (
      <span
        style={{
          display: 'inline-flex',
          padding: '0.15rem 0.45rem',
          fontSize: '0.7rem',
          fontWeight: 500,
          borderRadius: '4px',
          backgroundColor: '#eef2ff',
          color: '#4f46e5',
          border: '1px solid #e0e7ff',
        }}
      >
        Stock Adjustment
      </span>
    );
  }

  if (status === StockTransactionType.ALLOCATION || status === 'ALLOCATION') {
    return (
      <span
        style={{
          display: 'inline-flex',
          padding: '0.15rem 0.45rem',
          fontSize: '0.7rem',
          fontWeight: 500,
          borderRadius: '4px',
          backgroundColor: '#fffbeb',
          color: '#d97706',
          border: '1px solid #fde68a',
        }}
      >
        Dispatch Out
      </span>
    );
  }

  if (status === StockTransactionType.ALLOCATION_REVERSAL || status === 'ALLOCATION_REVERSAL') {
    return (
      <span
        style={{
          display: 'inline-flex',
          padding: '0.15rem 0.45rem',
          fontSize: '0.7rem',
          fontWeight: 500,
          borderRadius: '4px',
          backgroundColor: '#f0fdf4',
          color: '#16a34a',
          border: '1px solid #bbf7d0',
        }}
      >
        Restock In
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '0.15rem 0.45rem',
        fontSize: '0.7rem',
        fontWeight: 500,
        borderRadius: '4px',
        backgroundColor: '#f8fafc',
        color: '#475569',
        border: '1px solid #e2e8f0',
      }}
    >
      {String(status || 'N/A')}
    </span>
  );
}
