import type { Metadata } from 'next';
import { LoginForm } from '@/features/authentication';

export const metadata: Metadata = {
  title: 'Sign In | SCM Dashboard',
  description: 'Enterprise inventory authentication portal for managers and workforce employees.',
};

export default function LoginPage() {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        padding: '2.5rem 2rem',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem 0',
          }}
        >
          SCM Dashboard
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Sign in with your admin email or employee code to access the portal
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
