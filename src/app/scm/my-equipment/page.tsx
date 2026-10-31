import { Suspense } from 'react';
import { Metadata } from 'next';
import { MyEquipmentView } from '@/features/scm';

export const metadata: Metadata = {
  title: 'My Equipment & Assigned Kits | SCM Self-Service',
  description: 'Employee self-service equipment tracking and physical receipt confirmation.',
};

export default function ScmMyEquipmentPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          Loading My Equipment...
        </div>
      }
    >
      <MyEquipmentView />
    </Suspense>
  );
}
