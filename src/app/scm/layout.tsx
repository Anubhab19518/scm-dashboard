import React from 'react';
import type { Metadata } from 'next';
import { ScmShell } from '@/features/scm';

export const metadata: Metadata = {
  title: 'SCM Operations Console',
  description: 'Enterprise Inventory, Stock Ledger, Predefined Sets, and Equipment Allocations',
};

export default function ScmLayout({ children }: { children: React.ReactNode }) {
  return <ScmShell>{children}</ScmShell>;
}
