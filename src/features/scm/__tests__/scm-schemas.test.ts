import { describe, it, expect } from 'vitest';
import {
  createItemSchema,
  stockAdjustmentSchema,
  createSetSchema,
  createAllocationSchema,
  cancelAllocationSchema,
} from '../schemas/scm.schemas';
import { TrackingType, StockTransactionType } from '../types';

describe('SCM Zod Schemas Validation', () => {
  it('should validate valid item payload', () => {
    const valid = {
      itemCode: 'PPE-HELM-01',
      name: 'Safety Helmet',
      unit: 'PCS',
      trackingType: TrackingType.TRACKED,
      reorderLevel: 10,
      initialStock: 50,
      isActive: true,
    };

    const result = createItemSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject invalid stock adjustment with zero delta', () => {
    const invalid = {
      transactionType: StockTransactionType.STOCK_ADJUSTMENT,
      quantityDelta: 0,
      reason: 'No change',
    };

    const result = stockAdjustmentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should validate valid set creation payload', () => {
    const valid = {
      setCode: 'KIT-SECURITY',
      name: 'Security Kit',
      targetRole: 'Security Guard',
      items: [{ itemId: '188a1078-d106-4b53-b43e-c68997ef8d85', quantity: 2 }],
      isActive: true,
    };

    const result = createSetSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should validate multi-employee allocation creation payload', () => {
    const valid = {
      employeeIds: ['emp-1', 'emp-2'],
      setId: 'set-123',
      setQuantity: 1,
      notes: 'Deployment Q3',
    };

    const result = createAllocationSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should enforce non-empty cancellation reason', () => {
    const invalid = { reason: ' ' };
    const result = cancelAllocationSchema.safeParse(invalid);
    expect(result.success).toBe(false);

    const valid = { reason: 'Returned to warehouse due to transfer' };
    const validResult = cancelAllocationSchema.safeParse(valid);
    expect(validResult.success).toBe(true);
  });
});
