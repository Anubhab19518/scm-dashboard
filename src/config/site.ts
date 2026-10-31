export interface NavItem {
  readonly title: string;
  readonly href: string;
  readonly disabled?: boolean;
}

export const siteConfig = {
  name: 'SCM Dashboard',
  description:
    'Enterprise workforce inventory management, double-entry stock ledger, and equipment allocations.',
  url: 'http://localhost:3005',
  ogImage: '/og.png',
  mainNav: [
    { title: 'Dashboard', href: '/scm/dashboard' },
    { title: 'Inventory', href: '/scm/items' },
    { title: 'Stock Ledger', href: '/scm/stock-ledger' },
    { title: 'Sets & Kits', href: '/scm/sets' },
    { title: 'Allocations', href: '/scm/allocations' },
    { title: 'My Equipment', href: '/scm/my-equipment' },
    { title: 'Login', href: '/login' },
  ] as const satisfies readonly NavItem[],
  links: {
    github: 'https://github.com/example/scm-dashboard',
    docs: '/docs',
  },
} as const;

export type SiteConfig = typeof siteConfig;
