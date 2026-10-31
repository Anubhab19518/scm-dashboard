import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/shared/status-badge';
import { TrackingType, AllocationStatus } from '../types';

describe('SCM UI Components', () => {
  it('should render correct status badge for TRACKED asset', () => {
    render(<StatusBadge status={TrackingType.TRACKED} />);
    expect(screen.getByText(/Tracked Asset/i)).toBeDefined();
  });

  it('should render correct status badge for CONSUMABLE asset', () => {
    render(<StatusBadge status={TrackingType.CONSUMABLE} />);
    expect(screen.getByText(/Consumable/i)).toBeDefined();
  });

  it('should render correct status badge for ALLOCATED allocation', () => {
    render(<StatusBadge status={AllocationStatus.ALLOCATED} />);
    expect(screen.getByText(/Pending Receipt/i)).toBeDefined();
  });

  it('should render low stock alert when current stock is below reorder level', () => {
    render(<StatusBadge stock={5} reorderLevel={10} />);
    expect(screen.getByText(/Low Stock/i)).toBeDefined();
  });
});
