import { Suspense } from 'react';
import { Metadata } from 'next';
import { ItemListView } from '@/features/scm';

export const metadata: Metadata = {
  title: 'Items & Inventory Catalog | SCM Enterprise',
  description: 'Catalog management, tracking types, reorder levels, and stock monitoring.',
};

export default function ScmItemsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          Loading Inventory Catalog...
        </div>
      }
    >
      <ItemListView />
    </Suspense>
  );
}
