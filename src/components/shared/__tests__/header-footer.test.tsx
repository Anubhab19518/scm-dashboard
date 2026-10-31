import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { siteConfig } from '@/config/site';
import { Header } from '../header';
import { Footer } from '../footer';

describe('Header and Footer Components (AGENTS.md Rule 19)', () => {
  it('should render Header with brand title and navigation links', () => {
    render(<Header />);

    expect(screen.getByText(siteConfig.name)).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  it('should render Footer with copyright and operational status indicator', () => {
    render(<Footer />);

    expect(screen.getByText(/All Systems Operational/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(siteConfig.name, 'i'))).toBeInTheDocument();
  });
});
