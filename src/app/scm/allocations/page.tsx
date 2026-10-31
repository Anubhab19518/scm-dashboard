import { Suspense } from 'react';
import { Metadata } from 'next';
import { AllocationListView } from '@/features/scm';

export const metadata: Metadata = {
  title: 'Allocations & Workforce Dispatch | SCM Enterprise',
  description:
    'Issue standard kits to employees, verify receipt, and manage restock cancellations.',
};

export default function ScmAllocationsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          Loading Allocations...
        </div>
      }
    >
      <AllocationListView />
    </Suspense>
  );
}
