import { Suspense } from 'react';
import { Metadata } from 'next';
import { DashboardView } from '@/features/scm';

export const metadata: Metadata = {
  title: 'Dashboard Overview | SCM Enterprise',
  description: 'Real-time telemetry, active items, low stock alerts, and workforce allocations.',
};

export default function ScmDashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          Loading Dashboard...
        </div>
      }
    >
      <DashboardView />
    </Suspense>
  );
}
