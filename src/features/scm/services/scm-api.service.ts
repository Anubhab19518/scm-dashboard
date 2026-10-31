import {
  Item,
  ItemCategory,
  ItemSet,
  Allocation,
  StockLedgerEntry,
  StockSummaryStats,
  EmployeeLookup,
  AuthResponseData,
  WorkspaceOption,
} from '../types';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateItemInput,
  UpdateItemInput,
  StockAdjustmentInput,
  CreateSetInput,
  UpdateSetInput,
  CreateAllocationInput,
  CancelAllocationInput,
  AdminLoginInput,
  EmployeeLoginInput,
} from '../schemas/scm.schemas';
import { AuthSession } from './auth-session';

export class ScmApiError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ScmApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RawApiResponse<T> {
  status?: string;
  message?: string;
  data?: T;
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  total?: number;
  items?: Item[];
  entries?: StockLedgerEntry[];
  sets?: ItemSet[];
  allocations?: Allocation[];
  code?: string;
  errors?: unknown;
  details?: unknown;
  error?: {
    message?: string;
  };
}

import axios from 'axios';
import { apiClient } from '@/lib/api-client';

async function request<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string> | HeadersInit;
  } = {},
  customWorkspaceId?: string,
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {};

  if (options.headers) {
    if (typeof Headers !== 'undefined' && options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  if (customWorkspaceId) {
    headers['x-workspace-id'] = customWorkspaceId;
  }

  let data: unknown = undefined;
  if (options.body) {
    try {
      data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      data = options.body;
    }
  }

  // Normalize endpoint to have /api/v1 prefix if not already present and not full URL
  let url = endpoint;
  if (!url.startsWith('http')) {
    if (!url.startsWith('/api/v1')) {
      url = `/api/v1${url.startsWith('/') ? url : `/${url}`}`;
    }
  }

  try {
    const response = await apiClient({
      url,
      method,
      data,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const resData = response.data;
    if (resData && typeof resData === 'object' && 'data' in resData && resData.data !== undefined) {
      return resData.data as T;
    }
    return resData as T;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const resp = err.response?.data as RawApiResponse<unknown> | undefined;
      const errorMsg =
        resp?.message ||
        resp?.error?.message ||
        err.message ||
        `Request failed with status ${err.response?.status || 500}`;
      throw new ScmApiError(
        errorMsg,
        err.response?.status,
        resp?.code,
        resp?.errors || resp?.details,
      );
    }
    if (err instanceof ScmApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network request failed';
    throw new ScmApiError(message);
  }
}

export class ScmApiService {
  // ==========================================
  // AUTH & PERMISSIONS
  // ==========================================

  public static async adminLogin(input: AdminLoginInput): Promise<AuthResponseData> {
    try {
      return await request<AuthResponseData>('/users/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch {
      return request<AuthResponseData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    }
  }

  public static async employeeLogin(input: EmployeeLoginInput): Promise<AuthResponseData> {
    try {
      return await request<AuthResponseData>('/users/auth/employee/login', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch {
      return request<AuthResponseData>('/auth/employee/login', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    }
  }

  public static async fetchPermissions(userId: string, workspaceId: string): Promise<string[]> {
    try {
      const res = await request<Array<{ code?: string; name?: string } | string>>(
        `/authorization/users/${userId}/permissions?workspaceId=${workspaceId}`,
      );
      const list = Array.isArray(res) ? res : [];
      return list.map((p) => (typeof p === 'string' ? p : p.code || p.name || '')).filter(Boolean);
    } catch {
      return [];
    }
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  public static async listCategories(includeInactive: boolean = true): Promise<ItemCategory[]> {
    const query = includeInactive ? '?includeInactive=true' : '';
    return request<ItemCategory[]>(`/scm/categories${query}`);
  }

  public static async createCategory(input: CreateCategoryInput): Promise<ItemCategory> {
    return request<ItemCategory>('/scm/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public static async updateCategory(
    id: string,
    input: UpdateCategoryInput,
  ): Promise<ItemCategory> {
    return request<ItemCategory>(`/scm/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  public static async deleteCategory(id: string): Promise<void> {
    return request<void>(`/scm/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // ITEMS & INVENTORY
  // ==========================================

  public static async listItems(
    params: {
      search?: string;
      categoryId?: string;
      trackingType?: string;
      lowStockOnly?: boolean;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ items: Item[]; total?: number }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.trackingType) query.set('trackingType', params.trackingType);
    if (params.lowStockOnly !== undefined) query.set('lowStockOnly', String(params.lowStockOnly));
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<RawApiResponse<Item[]> | Item[]>(`/scm/items${qs}`);

    if (Array.isArray(res)) {
      return { items: res, total: res.length };
    }
    const itemsList = Array.isArray(res.data) ? res.data : res.items || [];
    return {
      items: itemsList,
      total: res.pagination?.total ?? res.total ?? itemsList.length,
    };
  }

  public static async getItem(id: string): Promise<Item> {
    return request<Item>(`/scm/items/${id}`);
  }

  public static async createItem(input: CreateItemInput): Promise<Item> {
    return request<Item>('/scm/items', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public static async updateItem(id: string, input: UpdateItemInput): Promise<Item> {
    return request<Item>(`/scm/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  public static async deleteItem(id: string): Promise<void> {
    return request<void>(`/scm/items/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // STOCK & LEDGER
  // ==========================================

  public static async getStockSummary(): Promise<StockSummaryStats> {
    try {
      const itemsRes = await this.listItems({ limit: 500 });
      const items = itemsRes.items;
      const setsRes = await this.listSets({ limit: 500 }).catch(() => ({ sets: [] }));
      const allocsRes = await this.listAllocations({ limit: 500 }).catch(() => ({
        allocations: [],
      }));

      const activeItems = items.filter((i) => i.isActive).length;
      const lowStockItems = items.filter((i) => i.currentStock <= i.reorderLevel).length;
      const activeAllocations = allocsRes.allocations.filter(
        (a) => a.status === 'ALLOCATED',
      ).length;
      const pendingConfirmations = allocsRes.allocations.filter(
        (a) => a.status === 'ALLOCATED',
      ).length;

      return {
        totalItems: items.length,
        activeItems,
        lowStockItems,
        activeAllocations,
        pendingConfirmations,
        totalSets: setsRes.sets.length,
      };
    } catch {
      return {
        totalItems: 0,
        activeItems: 0,
        lowStockItems: 0,
        activeAllocations: 0,
        pendingConfirmations: 0,
        totalSets: 0,
      };
    }
  }

  public static async listStockLedger(
    params: {
      page?: number;
      limit?: number;
      transactionType?: string;
      itemId?: string;
    } = {},
  ): Promise<{ entries: StockLedgerEntry[]; total?: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.transactionType) query.set('transactionType', params.transactionType);
    if (params.itemId) query.set('itemId', params.itemId);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const endpoint = params.itemId
      ? `/scm/items/${params.itemId}/stock-ledger${qs}`
      : `/scm/stock/ledger${qs}`;

    const res = await request<RawApiResponse<StockLedgerEntry[]> | StockLedgerEntry[]>(endpoint);
    if (Array.isArray(res)) {
      return { entries: res, total: res.length };
    }
    const entriesList = Array.isArray(res.data) ? res.data : res.entries || [];
    return {
      entries: entriesList,
      total: res.pagination?.total ?? res.total ?? entriesList.length,
    };
  }

  public static async adjustStock(
    itemId: string,
    input: StockAdjustmentInput,
  ): Promise<StockLedgerEntry> {
    return request<StockLedgerEntry>(`/scm/items/${itemId}/stock-adjustments`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // ==========================================
  // SETS / KITS
  // ==========================================

  public static async listSets(
    params: {
      search?: string;
      targetRole?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ sets: ItemSet[]; total?: number }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.targetRole) query.set('targetRole', params.targetRole);
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<RawApiResponse<ItemSet[]> | ItemSet[]>(`/scm/sets${qs}`);

    if (Array.isArray(res)) {
      return { sets: res, total: res.length };
    }
    const setsList = Array.isArray(res.data) ? res.data : res.sets || [];
    return {
      sets: setsList,
      total: res.pagination?.total ?? res.total ?? setsList.length,
    };
  }

  public static async getSet(id: string): Promise<ItemSet> {
    return request<ItemSet>(`/scm/sets/${id}`);
  }

  public static async createSet(input: CreateSetInput): Promise<ItemSet> {
    return request<ItemSet>('/scm/sets', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public static async updateSet(id: string, input: UpdateSetInput): Promise<ItemSet> {
    return request<ItemSet>(`/scm/sets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  public static async deleteSet(id: string): Promise<void> {
    return request<void>(`/scm/sets/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // ALLOCATIONS & DISPATCH
  // ==========================================

  public static async listAllocations(
    params: {
      search?: string;
      employeeId?: string;
      companyId?: string;
      departmentId?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ allocations: Allocation[]; total?: number }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.employeeId) query.set('employeeId', params.employeeId);
    if (params.companyId) query.set('companyId', params.companyId);
    if (params.departmentId) query.set('departmentId', params.departmentId);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<RawApiResponse<Allocation[]> | Allocation[]>(`/scm/allocations${qs}`);

    if (Array.isArray(res)) {
      return { allocations: res, total: res.length };
    }
    const allocsList = Array.isArray(res.data) ? res.data : res.allocations || [];
    return {
      allocations: allocsList,
      total: res.pagination?.total ?? res.total ?? allocsList.length,
    };
  }

  public static async createAllocation(input: CreateAllocationInput): Promise<Allocation[]> {
    return request<Allocation[]>('/scm/allocations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public static async receiveAllocation(id: string): Promise<Allocation> {
    return request<Allocation>(`/scm/allocations/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  public static async confirmAllocationReceipt(id: string): Promise<Allocation> {
    return this.receiveAllocation(id);
  }

  public static async cancelAllocation(
    id: string,
    input: CancelAllocationInput,
  ): Promise<Allocation> {
    return request<Allocation>(`/scm/allocations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // ==========================================
  // EMPLOYEE SELF-SERVICE
  // ==========================================

  public static async getMyAllocations(): Promise<Allocation[]> {
    return request<Allocation[]>('/scm/me/allocations');
  }

  public static async listMyAllocations(): Promise<Allocation[]> {
    return this.getMyAllocations();
  }

  public static async receiveMyAllocation(id: string): Promise<Allocation> {
    return request<Allocation>(`/scm/me/allocations/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // ==========================================
  // HR & WORKSPACE LOOKUPS
  // ==========================================

  public static async listEmployees(): Promise<EmployeeLookup[]> {
    interface RawEmployee {
      id: string;
      employeeCode?: string;
      code?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      department?: { name?: string };
      departmentName?: string;
      company?: { name?: string };
      companyName?: string;
      jobRole?: { name?: string };
      designation?: string;
      role?: string;
    }

    try {
      const res = await request<
        RawEmployee[] | { data?: RawEmployee[]; employees?: RawEmployee[] }
      >('/employees?limit=200');
      const list: RawEmployee[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : res?.employees || [];

      return list.map((e) => ({
        id: e.id,
        employeeCode: e.employeeCode || e.code || `EMP-${e.id.slice(0, 4)}`,
        name: e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Unnamed Employee',
        email: e.email,
        departmentName: e.department?.name || e.departmentName,
        companyName: e.company?.name || e.companyName,
        designation: e.jobRole?.name || e.designation || e.role,
      }));
    } catch {
      // Fallback workforce list if HR endpoint offline
      return [
        {
          id: '89543efd-7954-4b8d-b3b0-edb316d99628',
          employeeCode: 'EMP4991',
          name: 'Shakti Mohan',
          email: 'shakti@wok.in',
          departmentName: 'Security Operations',
          companyName: 'Urgent Manpower Services',
          designation: 'Security Officer',
        },
        {
          id: 'f1234567-89ab-cdef-0123-456789abcdef',
          employeeCode: 'EMP5012',
          name: 'Vikram Singh',
          email: 'vikram.singh@urgentmanpower.com',
          departmentName: 'Facility Engineering',
          companyName: 'Urgent Manpower Services',
          designation: 'Site Supervisor',
        },
        {
          id: 'd9876543-21ba-fedc-ba98-76543210fedc',
          employeeCode: 'EMP5140',
          name: 'Anjali Sharma',
          email: 'anjali.s@urgentmanpower.com',
          departmentName: 'Industrial Safety',
          companyName: 'Global Logistics Corp',
          designation: 'Safety Officer',
        },
        {
          id: 'a1122334-5566-7788-99aa-bbccddeeff00',
          employeeCode: 'EMP5299',
          name: 'Rahul Verma',
          email: 'rahul.verma@urgentmanpower.com',
          departmentName: 'Warehouse Logistics',
          companyName: 'Urgent Manpower Services',
          designation: 'Logistics Handler',
        },
      ];
    }
  }

  public static async listWorkspaces(): Promise<WorkspaceOption[]> {
    const auth = AuthSession.getStoredAuth();
    const isSuperAdmin = auth.user?.isSuperAdmin;

    type RawWs = {
      id: string;
      name: string;
      slug?: string;
      code?: string;
      status?: string;
      location?: string;
    };

    let rawList: RawWs[] = [];

    if (isSuperAdmin) {
      try {
        const resAdmin = await request<RawWs[] | { data?: RawWs[] }>('/workspaces/admin/all');
        rawList = Array.isArray(resAdmin)
          ? resAdmin
          : Array.isArray((resAdmin as { data?: RawWs[] })?.data)
            ? (resAdmin as { data: RawWs[] }).data
            : [];
      } catch {
        // Fallback to regular list
      }
    }

    if (rawList.length === 0) {
      try {
        const res = await request<RawWs[] | { data?: RawWs[] }>('/workspaces');
        rawList = Array.isArray(res)
          ? res
          : Array.isArray((res as { data?: RawWs[] })?.data)
            ? (res as { data: RawWs[] }).data
            : [];
      } catch {
        // Handled
      }
    }

    if (rawList.length > 0) {
      return rawList.map((w) => ({
        id: w.id,
        name: w.name,
        code: w.slug || w.code || undefined,
        location: w.location || (w.status ? `Status: ${w.status}` : undefined),
      }));
    }

    return [];
  }
}

export interface SetItemInput {
  itemId: string;
  quantity: number;
}

export interface CreateSetDto {
  setCode: string;
  name: string;
  description?: string;
  targetRole?: string;
  targetDepartment?: string;
  items: SetItemInput[];
  isActive?: boolean;
}

export interface UpdateSetDto {
  name?: string;
  description?: string;
  targetRole?: string;
  targetDepartment?: string;
  items?: SetItemInput[];
  isActive?: boolean;
}

export const scmSetsApi = {
  // Fetch real sets from backend
  async listSets(params?: {
    isActive?: boolean;
    targetRole?: string;
    page?: number;
    limit?: number;
  }) {
    const res = await apiClient.get('/api/v1/scm/sets', { params });
    return res.data;
  },
  // Get set by UUID
  async getSetById(id: string) {
    const res = await apiClient.get(`/api/v1/scm/sets/${id}`);
    return res.data?.data ?? res.data;
  },
  // Create new set
  async createSet(payload: CreateSetDto) {
    const res = await apiClient.post('/api/v1/scm/sets', payload);
    return res.data?.data ?? res.data;
  },
  // Update existing set
  async updateSet(id: string, payload: UpdateSetDto) {
    const res = await apiClient.patch(`/api/v1/scm/sets/${id}`, payload);
    return res.data?.data ?? res.data;
  },
};
