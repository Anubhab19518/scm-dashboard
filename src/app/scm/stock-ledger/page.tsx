import { Suspense } from 'react';
import { Metadata } from 'next';
import { StockLedgerView } from '@/features/scm';

export const metadata: Metadata = {
  title: 'Stock Ledger & Inward Adjustments | SCM Enterprise',
  description: 'Chronological double-entry stock ledger movements and inward receipts.',
};

export default function ScmStockLedgerPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          Loading Stock Ledger...
        </div>
      }
    >
      <StockLedgerView />
    </Suspense>
  );
}
