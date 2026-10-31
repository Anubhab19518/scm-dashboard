import { z } from 'zod';
import { TrackingType, StockTransactionType } from '../types';

export const createCategorySchema = z.object({
  code: z.string().min(1, 'Category code is required').max(50),
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createItemSchema = z.object({
  itemCode: z.string().min(1, 'Item code is required').max(50),
  name: z.string().min(1, 'Item name is required').max(150),
  description: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
  unit: z.string().min(1, 'Unit of measurement is required').default('PCS'),
  trackingType: z.nativeEnum(TrackingType),
  reorderLevel: z.coerce.number().min(0, 'Reorder level must be >= 0').default(10),
  initialStock: z.coerce.number().min(0, 'Initial stock must be >= 0').default(0),
  isActive: z.boolean().default(true),
});

export const updateItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(150).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  unit: z.string().min(1).optional(),
  trackingType: z.nativeEnum(TrackingType).optional(),
  reorderLevel: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const stockAdjustmentSchema = z.object({
  transactionType: z
    .literal(StockTransactionType.STOCK_ADJUSTMENT)
    .default(StockTransactionType.STOCK_ADJUSTMENT),
  quantityDelta: z.coerce.number().refine((val) => val !== 0, 'Quantity delta cannot be zero'),
  reason: z.string().min(3, 'Reason must be at least 3 characters long'),
  referenceType: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
});

export const setItemInputSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

export const createSetSchema = z.object({
  setCode: z.string().min(1, 'Set code is required').max(50),
  name: z.string().min(1, 'Set name is required').max(150),
  description: z.string().optional(),
  targetRole: z.string().optional().nullable(),
  targetDepartment: z.string().optional().nullable(),
  items: z.array(setItemInputSchema).min(1, 'At least one item must be included in the set'),
  isActive: z.boolean().default(true),
});

export const updateSetSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetRole: z.string().optional().nullable(),
  targetDepartment: z.string().optional().nullable(),
  items: z.array(setItemInputSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const createAllocationSchema = z.object({
  employeeIds: z
    .array(z.string().min(1, 'Employee ID is required'))
    .min(1, 'Please select at least one employee'),
  setId: z.string().min(1, 'Please select a Kit/Set'),
  setQuantity: z.coerce.number().min(1, 'Set quantity must be at least 1').default(1),
  notes: z.string().optional(),
});

export const cancelAllocationSchema = z.object({
  reason: z.string().min(3, 'Please provide a cancellation reason (min 3 characters)'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const employeeLoginSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  password: z.string().min(1, 'Password is required'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type CreateSetInput = z.infer<typeof createSetSchema>;
export type UpdateSetInput = z.infer<typeof updateSetSchema>;
export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
export type CancelAllocationInput = z.infer<typeof cancelAllocationSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type EmployeeLoginInput = z.infer<typeof employeeLoginSchema>;
