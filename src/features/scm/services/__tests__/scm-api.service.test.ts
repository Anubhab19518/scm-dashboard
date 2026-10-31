import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScmApiService, ScmApiError } from '../scm-api.service';
import { TrackingType, StockTransactionType, AllocationStatus } from '../../types';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => {
  const mockFn = vi.fn();
  return {
    apiClient: Object.assign(mockFn, {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      defaults: { headers: {} },
    }),
  };
});

describe('ScmApiService Core Methods', () => {
  const mockedApiClient = vi.mocked(apiClient);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should list items and parse pagination metadata', async () => {
    const mockItems = [
      {
        id: 'item-1',
        itemCode: 'SAF-001',
        name: 'Safety Helmet',
        unit: 'PCS',
        trackingType: TrackingType.TRACKED,
        currentStock: 25,
        reorderLevel: 5,
        isActive: true,
        workspaceId: 'ws-1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    mockedApiClient.mockResolvedValueOnce({
      status: 200,
      data: {
        data: mockItems,
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    } as never);

    const result = await ScmApiService.listItems({
      search: 'Safety',
      categoryId: 'cat-1',
      trackingType: TrackingType.TRACKED,
      lowStockOnly: true,
      page: 1,
      limit: 10,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe('Safety Helmet');
    expect(result.total).toBe(1);
  });

  it('should get single item by id', async () => {
    mockedApiClient.mockResolvedValueOnce({
      status: 200,
      data: {
        data: { id: 'item-1', name: 'Safety Boots' },
      },
    } as never);

    const item = await ScmApiService.getItem('item-1');
    expect(item.id).toBe('item-1');
  });

  it('should update item', async () => {
    mockedApiClient.mockResolvedValueOnce({
      status: 200,
      data: {
        data: { id: 'item-1', name: 'Updated Boots' },
      },
    } as never);

    const updated = await ScmApiService.updateItem('item-1', { name: 'Updated Boots' });
    expect(updated.name).toBe('Updated Boots');
  });

  it('should create an item with POST request', async () => {
    const newItem = {
      itemCode: 'GLV-001',
      name: 'Nitrile Gloves',
      unit: 'PAIR',
      trackingType: TrackingType.CONSUMABLE,
      reorderLevel: 20,
      initialStock: 100,
      isActive: true,
    };

    mockedApiClient.mockResolvedValueOnce({
      status: 201,
      data: {
        data: { id: 'item-created-1', ...newItem },
      },
    } as never);

    const created = await ScmApiService.createItem(newItem);
    expect(created.id).toBe('item-created-1');
    expect(created.name).toBe('Nitrile Gloves');
  });

  it('should record stock adjustments and return ledger entry', async () => {
    mockedApiClient.mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          id: 'ledger-1',
          itemId: 'item-1',
          transactionType: StockTransactionType.STOCK_ADJUSTMENT,
          quantity: 10,
          balanceAfter: 35,
          unit: 'PCS',
          createdAt: '2026-01-01',
        },
      },
    } as never);

    const result = await ScmApiService.adjustStock('item-1', {
      transactionType: StockTransactionType.STOCK_ADJUSTMENT,
      quantityDelta: 10,
      reason: 'Physical inventory audit adjustment',
    });

    expect(result.balanceAfter).toBe(35);
    expect(result.transactionType).toBe(StockTransactionType.STOCK_ADJUSTMENT);
  });

  it('should list stock ledger entries with filters', async () => {
    mockedApiClient.mockResolvedValueOnce({
      status: 200,
      data: {
        data: [
          {
            id: 'entry-1',
            itemId: 'item-1',
            quantity: 5,
            transactionType: StockTransactionType.OPENING_STOCK,
          },
        ],
        pagination: { total: 1 },
      },
    } as never);

    const res = await ScmApiService.listStockLedger({
      itemId: 'item-1',
      transactionType: StockTransactionType.OPENING_STOCK,
      page: 1,
      limit: 10,
    });

    expect(res.entries).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it('should fetch stock summary stats', async () => {
    vi.spyOn(ScmApiService, 'listItems').mockResolvedValueOnce({
      items: [
        {
          id: 'i-1',
          isActive: true,
          currentStock: 2,
          reorderLevel: 5,
        } as never,
        {
          id: 'i-2',
          isActive: true,
          currentStock: 20,
          reorderLevel: 5,
        } as never,
      ],
      total: 2,
    });
    vi.spyOn(ScmApiService, 'listSets').mockResolvedValueOnce({
      sets: [{ id: 's-1' } as never],
      total: 1,
    });
    vi.spyOn(ScmApiService, 'listAllocations').mockResolvedValueOnce({
      allocations: [{ id: 'a-1', status: 'ALLOCATED' } as never],
      total: 1,
    });

    const stats = await ScmApiService.getStockSummary();
    expect(stats.totalItems).toBe(2);
    expect(stats.lowStockItems).toBe(1);
    expect(stats.totalSets).toBe(1);
  });

  it('should manage categories (list, create, update, delete)', async () => {
    mockedApiClient
      .mockResolvedValueOnce({
        status: 200,
        data: { data: [{ id: 'cat-1', name: 'PPE' }] },
      } as never)
      .mockResolvedValueOnce({
        status: 201,
        data: { data: { id: 'cat-2', name: 'Tools' } },
      } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { data: { id: 'cat-2', name: 'Hand Tools' } },
      } as never)
      .mockResolvedValueOnce({
        status: 204,
        data: {},
      } as never);

    const cats = await ScmApiService.listCategories();
    expect(cats).toHaveLength(1);

    const created = await ScmApiService.createCategory({
      name: 'Tools',
      code: 'TLS',
      isActive: true,
    });
    expect(created.name).toBe('Tools');

    const updated = await ScmApiService.updateCategory('cat-2', { name: 'Hand Tools' });
    expect(updated.name).toBe('Hand Tools');

    await expect(ScmApiService.deleteCategory('cat-2')).resolves.not.toThrow();
  });

  it('should manage sets/kits (list, get, create, update, delete)', async () => {
    mockedApiClient
      .mockResolvedValueOnce({
        status: 200,
        data: { data: [{ id: 'set-1', name: 'Starter Kit' }] },
      } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { data: { id: 'set-1', name: 'Starter Kit' } },
      } as never)
      .mockResolvedValueOnce({
        status: 201,
        data: { data: { id: 'set-2', name: 'Safety Kit' } },
      } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { data: { id: 'set-2', name: 'Advanced Safety Kit' } },
      } as never)
      .mockResolvedValueOnce({
        status: 204,
        data: {},
      } as never);

    const sets = await ScmApiService.listSets();
    expect(sets.sets).toHaveLength(1);

    const set = await ScmApiService.getSet('set-1');
    expect(set.id).toBe('set-1');

    const created = await ScmApiService.createSet({
      setCode: 'SET-SAFE-01',
      name: 'Safety Kit',
      items: [{ itemId: 'item-1', quantity: 1 }],
      isActive: true,
    });
    expect(created.name).toBe('Safety Kit');

    const updated = await ScmApiService.updateSet('set-2', { name: 'Advanced Safety Kit' });
    expect(updated.name).toBe('Advanced Safety Kit');

    await expect(ScmApiService.deleteSet('set-2')).resolves.not.toThrow();
  });

  it('should create and cancel allocations and fetch allocations list', async () => {
    mockedApiClient
      .mockResolvedValueOnce({
        status: 201,
        data: {
          data: [
            {
              id: 'alloc-1',
              employeeId: 'emp-1',
              status: AllocationStatus.ALLOCATED,
            },
          ],
        },
      } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: {
          data: {
            id: 'alloc-1',
            status: AllocationStatus.CANCELLED,
          },
        },
      } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: {
          data: [{ id: 'alloc-1', employeeId: 'emp-1' }],
          pagination: { total: 1 },
        },
      } as never);

    const created = await ScmApiService.createAllocation({
      employeeIds: ['emp-1'],
      setId: 'set-1',
      setQuantity: 1,
    });
    expect(created).toHaveLength(1);
    expect(created[0]?.status).toBe(AllocationStatus.ALLOCATED);

    const cancelled = await ScmApiService.cancelAllocation('alloc-1', {
      reason: 'Employee transferred to different site',
    });
    expect(cancelled.status).toBe(AllocationStatus.CANCELLED);

    const list = await ScmApiService.listAllocations({ employeeId: 'emp-1' });
    expect(list.allocations).toHaveLength(1);
  });

  it('should list employees and workspaces', async () => {
    mockedApiClient
      .mockResolvedValueOnce({
        status: 200,
        data: { data: [{ id: 'emp-1', name: 'John Doe' }] },
      } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { data: [{ id: 'ws-1', name: 'Site Alpha' }] },
      } as never);

    const emps = await ScmApiService.listEmployees();
    expect(emps).toHaveLength(1);

    const ws = await ScmApiService.listWorkspaces();
    expect(ws).toHaveLength(1);
  });

  it('should test employee self-service and scmSetsApi methods', async () => {
    mockedApiClient
      .mockResolvedValueOnce({
        status: 200,
        data: { data: [{ id: 'alloc-mine-1' }] },
      } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { data: { id: 'alloc-mine-1', status: 'RECEIVED' } },
      } as never);

    const myAllocs = await ScmApiService.getMyAllocations();
    expect(myAllocs).toHaveLength(1);

    const received = await ScmApiService.receiveMyAllocation('alloc-mine-1');
    expect(received.status).toBe('RECEIVED');

    // Test scmSetsApi
    mockedApiClient.get = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 'set-1' }] } as never)
      .mockResolvedValueOnce({ data: { data: { id: 'set-1', name: 'Kit 1' } } } as never);
    mockedApiClient.post = vi
      .fn()
      .mockResolvedValueOnce({ data: { data: { id: 'set-created' } } } as never);
    mockedApiClient.patch = vi
      .fn()
      .mockResolvedValueOnce({ data: { data: { id: 'set-updated' } } } as never);

    const { scmSetsApi } = await import('../scm-api.service');
    const sets = await scmSetsApi.listSets();
    expect(sets).toHaveLength(1);

    const singleSet = await scmSetsApi.getSetById('set-1');
    expect(singleSet.name).toBe('Kit 1');

    const created = await scmSetsApi.createSet({
      setCode: 'SET-01',
      name: 'Kit 01',
      items: [{ itemId: 'item-1', quantity: 1 }],
    });
    expect(created.id).toBe('set-created');

    const updated = await scmSetsApi.updateSet('set-1', { name: 'Kit Updated' });
    expect(updated.id).toBe('set-updated');
  });

  it('should instantiate and throw ScmApiError properly', () => {
    const error = new ScmApiError('Sample Error', 400, 'ERR_BAD_REQUEST', { field: 'name' });
    expect(error.name).toBe('ScmApiError');
    expect(error.status).toBe(400);
    expect(error.code).toBe('ERR_BAD_REQUEST');
  });
});
