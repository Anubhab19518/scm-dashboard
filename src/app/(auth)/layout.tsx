import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: '#f8fafc',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>{children}</div>
    </div>
  );
}
