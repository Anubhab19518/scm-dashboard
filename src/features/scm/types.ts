export enum TrackingType {
  CONSUMABLE = 'CONSUMABLE', // e.g., Gloves, masks, disposable PPE
  TRACKED = 'TRACKED', // e.g., Safety boots, helmets, smartphones, bodycams
}

export enum StockTransactionType {
  OPENING_STOCK = 'OPENING_STOCK',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  ALLOCATION = 'ALLOCATION',
  ALLOCATION_REVERSAL = 'ALLOCATION_REVERSAL',
}

export enum AllocationStatus {
  ALLOCATED = 'ALLOCATED', // Initial state upon dispatch
  RECEIVED = 'RECEIVED', // Confirmed by employee / supervisor
  CANCELLED = 'CANCELLED', // Cancelled by admin (reverses stock automatically)
}

export interface ItemCategory {
  id: string;
  workspaceId: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  workspaceId: string;
  itemCode: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  category?: ItemCategory | null;
  unit: string; // e.g. "PCS", "PAIR", "BOX", "SET"
  trackingType: TrackingType;
  reorderLevel: number;
  currentStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SetItem {
  id: string;
  workspaceId: string;
  setId: string;
  itemId: string;
  quantity: number;
  item?: Item;
}

export interface ItemSet {
  id: string;
  workspaceId: string;
  setCode: string;
  name: string;
  description?: string | null;
  targetRole?: string | null;
  targetDepartment?: string | null;
  isActive: boolean;
  items?: SetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AllocationItem {
  id: string;
  workspaceId: string;
  allocationId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  trackingType: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: string;
  workspaceId: string;
  allocationNumber: string;
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  jobRoleId?: string | null;
  jobRoleName?: string | null;
  setId?: string | null;
  setName?: string | null;
  setQuantity: number;
  status: AllocationStatus;
  allocatedBy?: string | null;
  allocatedAt: string;
  receivedBy?: string | null;
  receivedAt?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  notes?: string | null;
  items?: AllocationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StockLedgerEntry {
  id: string;
  workspaceId: string;
  itemId: string;
  transactionType: StockTransactionType;
  quantityDelta: number;
  balanceAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  performedBy?: string | null;
  reason?: string | null;
  createdAt: string;
  item?: Item | null;
}

export interface SCMUser {
  id: string;
  email?: string;
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  isSuperAdmin?: boolean;
  status?: string;
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken?: string;
  user: SCMUser;
  forceChange?: boolean;
}

export interface WorkspaceOption {
  id: string;
  name: string;
  code?: string;
  location?: string;
  isDefault?: boolean;
}

export interface EmployeeLookup {
  id: string;
  employeeCode: string;
  name: string;
  email?: string;
  departmentName?: string;
  companyName?: string;
  designation?: string;
}

export interface StockSummaryStats {
  totalItems: number;
  activeItems: number;
  lowStockItems: number;
  activeAllocations: number;
  pendingConfirmations: number;
  totalSets: number;
}

export type StandardSet = ItemSet;
export type TransactionType = StockTransactionType;
