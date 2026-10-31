import { Suspense } from 'react';
import { Metadata } from 'next';
import { SetListView } from '@/features/scm';

export const metadata: Metadata = {
  title: 'Standard Sets & Kits | SCM Enterprise',
  description: 'Role-based equipment bundles, PPE sets, and standardized kit configurator.',
};

export default function ScmSetsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          Loading Sets & Kits...
        </div>
      }
    >
      <SetListView />
    </Suspense>
  );
}
