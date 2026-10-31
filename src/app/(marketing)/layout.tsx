import type { ReactNode } from 'react';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
