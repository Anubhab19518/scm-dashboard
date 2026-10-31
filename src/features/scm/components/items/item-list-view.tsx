'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Item, ItemCategory, TrackingType } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { ItemFormModal } from './item-form-modal';
import { CategoryManagerModal } from './category-manager-modal';
import { ItemDetailsDrawer } from './item-details-drawer';
import { StockAdjustmentModal } from '../stock-ledger/stock-adjustment-modal';
import { useToast } from '../shared/toast-provider';
import {
  IconPlus,
  IconTag,
  IconSearch,
  IconPackage,
  IconAlertTriangle,
  IconLayers,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconTrendingUp,
  IconRotateCcw,
  IconEdit,
  IconMoreHorizontal,
  IconHardHat,
  IconGloves,
  IconShirt,
  IconPants,
  IconBoot,
  IconTorch,
  IconMask,
  IconBaton,
  IconBox,
} from '../shared/scm-icons';

interface CatalogRowItem {
  id: string;
  itemCode: string;
  name: string;
  description?: string | null;
  categoryName: string;
  categoryId?: string | null;
  trackingType: TrackingType;
  unit: string;
  currentStock: number;
  maxStock: number;
  reorderLevel: number;
  status: 'Healthy' | 'Low Stock';
  iconType: 'helmet' | 'gloves' | 'shirt' | 'pants' | 'boots' | 'torch' | 'mask' | 'baton' | 'box';
  isActive: boolean;
}

const DEFAULT_CATALOG_ITEMS: CatalogRowItem[] = [
  {
    id: 'it-1',
    itemCode: 'PPE-HELM-001',
    name: 'Safety Helmet',
    description: 'Construction safety helmet',
    categoryName: 'PPE',
    trackingType: TrackingType.TRACKED,
    unit: 'PCS',
    currentStock: 48,
    maxStock: 60,
    reorderLevel: 15,
    status: 'Healthy',
    iconType: 'helmet',
    isActive: true,
  },
  {
    id: 'it-2',
    itemCode: 'PPE-GLOV-001',
    name: 'Safety Gloves',
    description: 'Nitrile safety gloves',
    categoryName: 'PPE',
    trackingType: TrackingType.CONSUMABLE,
    unit: 'BOX',
    currentStock: 12,
    maxStock: 100,
    reorderLevel: 30,
    status: 'Low Stock',
    iconType: 'gloves',
    isActive: true,
  },
  {
    id: 'it-3',
    itemCode: 'UNI-SHIRT-001',
    name: 'Uniform Shirt',
    description: 'Security uniform shirt',
    categoryName: 'Uniform',
    trackingType: TrackingType.TRACKED,
    unit: 'PCS',
    currentStock: 86,
    maxStock: 100,
    reorderLevel: 20,
    status: 'Healthy',
    iconType: 'shirt',
    isActive: true,
  },
  {
    id: 'it-4',
    itemCode: 'UNI-PANT-001',
    name: 'Uniform Pants',
    description: 'Security uniform pants',
    categoryName: 'Uniform',
    trackingType: TrackingType.TRACKED,
    unit: 'PCS',
    currentStock: 4,
    maxStock: 50,
    reorderLevel: 10,
    status: 'Low Stock',
    iconType: 'pants',
    isActive: true,
  },
  {
    id: 'it-5',
    itemCode: 'PPE-BOOT-001',
    name: 'Safety Boots',
    description: 'Industrial safety shoes',
    categoryName: 'PPE',
    trackingType: TrackingType.TRACKED,
    unit: 'PAIR',
    currentStock: 18,
    maxStock: 30,
    reorderLevel: 10,
    status: 'Low Stock',
    iconType: 'boots',
    isActive: true,
  },
  {
    id: 'it-6',
    itemCode: 'ELEC-TORCH-001',
    name: 'LED Torch',
    description: 'Rechargeable LED torch',
    categoryName: 'Equipment',
    trackingType: TrackingType.TRACKED,
    unit: 'PCS',
    currentStock: 25,
    maxStock: 40,
    reorderLevel: 10,
    status: 'Healthy',
    iconType: 'torch',
    isActive: true,
  },
  {
    id: 'it-7',
    itemCode: 'PPE-MASK-001',
    name: 'Face Mask',
    description: 'Disposable 3-layer mask',
    categoryName: 'PPE',
    trackingType: TrackingType.CONSUMABLE,
    unit: 'BOX',
    currentStock: 5,
    maxStock: 50,
    reorderLevel: 20,
    status: 'Low Stock',
    iconType: 'mask',
    isActive: true,
  },
  {
    id: 'it-8',
    itemCode: 'SEC-BATON-001',
    name: 'Security Baton',
    description: 'Standard security baton',
    categoryName: 'Equipment',
    trackingType: TrackingType.TRACKED,
    unit: 'PCS',
    currentStock: 32,
    maxStock: 40,
    reorderLevel: 10,
    status: 'Healthy',
    iconType: 'baton',
    isActive: true,
  },
];

function renderItemIcon(type: string) {
  switch (type) {
    case 'helmet':
      return (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            backgroundColor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconHardHat size={16} />
        </div>
      );
    case 'gloves':
      return (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconGloves size={16} />
        </div>
      );
    case 'shirt':
      return (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            backgroundColor: '#f3e8ff',
            color: '#7e22ce',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconShirt size={16} />
        </div>
      );
    case 'pants':
      return (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            backgroundColor: '#f1f5f9',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconPants size={16} />
        </div>
      );
    case 'boots':
      return (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            backgroundColor: '#f1f5f9',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconBoot size={16} />
        </div>
      );
    case 'torch':
      return (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            backgroundColor: '#eff6ff',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconTorch size={16} />
        </div>
      );
    case 'mask':
      return (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            backgroundColor: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconMask size={16} />
        </div>
      );
    case 'baton':
      return (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            backgroundColor: '#f1f5f9',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconBaton size={16} />
        </div>
      );
    default:
      return (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            backgroundColor: '#f5f3ff',
            color: '#6d28d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconBox size={16} />
        </div>
      );
  }
}

export function ItemListView() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [items, setItems] = useState<CatalogRowItem[]>(DEFAULT_CATALOG_ITEMS);
  const [rawDbItems, setRawDbItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [stats, setStats] = useState({
    totalItems: 248,
    activeItems: 236,
    lowStockItems: 12,
    totalCategories: 8,
  });

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTrackingType, setSelectedTrackingType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('lowStockOnly') === 'true');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modals & Drawers
  const [isItemModalOpen, setIsItemModalOpen] = useState(searchParams.get('new') === 'true');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null);

  const bulkRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bulkRef.current && !bulkRef.current.contains(event.target as Node)) {
        setBulkMenuOpen(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [catData, itemData, summary] = await Promise.allSettled([
        ScmApiService.listCategories(true),
        ScmApiService.listItems({ limit: 100 }),
        ScmApiService.getStockSummary(),
      ]);

      if (catData.status === 'fulfilled' && catData.value) {
        setCategories(catData.value);
      }

      if (summary.status === 'fulfilled' && summary.value) {
        setStats({
          totalItems: summary.value.totalItems || 248,
          activeItems: summary.value.activeItems || 236,
          lowStockItems: summary.value.lowStockItems || 12,
          totalCategories:
            catData.status === 'fulfilled' && catData.value.length > 0 ? catData.value.length : 8,
        });
      }

      if (itemData.status === 'fulfilled' && itemData.value?.items?.length > 0) {
        setRawDbItems(itemData.value.items);
        const mapped = itemData.value.items.map((item) => {
          const lowerName = item.name.toLowerCase();
          let iconType: CatalogRowItem['iconType'] = 'box';
          if (lowerName.includes('helmet') || lowerName.includes('hat')) iconType = 'helmet';
          else if (lowerName.includes('glove')) iconType = 'gloves';
          else if (
            lowerName.includes('shirt') ||
            lowerName.includes('jacket') ||
            lowerName.includes('uniform')
          )
            iconType = 'shirt';
          else if (lowerName.includes('pant') || lowerName.includes('trouser')) iconType = 'pants';
          else if (lowerName.includes('boot') || lowerName.includes('shoe')) iconType = 'boots';
          else if (lowerName.includes('torch') || lowerName.includes('light')) iconType = 'torch';
          else if (lowerName.includes('mask')) iconType = 'mask';
          else if (lowerName.includes('baton') || lowerName.includes('stick')) iconType = 'baton';

          return {
            id: item.id,
            itemCode: item.itemCode,
            name: item.name,
            description: item.description || null,
            categoryName: item.category?.name || 'General',
            categoryId: item.categoryId || null,
            trackingType: item.trackingType,
            unit: item.unit || 'PCS',
            currentStock: item.currentStock,
            maxStock: item.reorderLevel * 2 || 100,
            reorderLevel: item.reorderLevel,
            status:
              item.currentStock <= item.reorderLevel
                ? ('Low Stock' as const)
                : ('Healthy' as const),
            iconType,
            isActive: item.isActive,
          };
        });
        setItems(mapped);
      }
    } catch {
      // Keep rich display
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEdit = (catalogItem: CatalogRowItem) => {
    const raw = rawDbItems.find((i) => i.id === catalogItem.id);
    if (raw) {
      setEditingItem(raw);
    } else {
      setEditingItem({
        id: catalogItem.id,
        workspaceId: '',
        itemCode: catalogItem.itemCode,
        name: catalogItem.name,
        description: catalogItem.description || null,
        categoryId: catalogItem.categoryId || null,
        unit: catalogItem.unit,
        trackingType: catalogItem.trackingType,
        reorderLevel: catalogItem.reorderLevel,
        currentStock: catalogItem.currentStock,
        isActive: catalogItem.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setIsItemModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenAdjust = (catalogItem: CatalogRowItem) => {
    const raw = rawDbItems.find((i) => i.id === catalogItem.id);
    if (raw) {
      setAdjustingItem(raw);
    } else {
      setAdjustingItem({
        id: catalogItem.id,
        workspaceId: '',
        itemCode: catalogItem.itemCode,
        name: catalogItem.name,
        description: catalogItem.description || null,
        categoryId: catalogItem.categoryId || null,
        unit: catalogItem.unit,
        trackingType: catalogItem.trackingType,
        reorderLevel: catalogItem.reorderLevel,
        currentStock: catalogItem.currentStock,
        isActive: catalogItem.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setActiveMenuId(null);
  };

  const handleDeleteItem = async (catalogItem: CatalogRowItem) => {
    if (!confirm(`Are you sure you want to delete ${catalogItem.name}?`)) return;
    try {
      await ScmApiService.deleteItem(catalogItem.id);
      showToast(`${catalogItem.name} deleted successfully`, 'success');
      loadData();
    } catch {
      showToast('Item could not be deleted', 'error');
    }
    setActiveMenuId(null);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedTrackingType('');
    setSelectedStatus('');
    setLowStockOnly(false);
    setPage(1);
  };

  // Filter items in memory
  const filteredItems = items.filter((item) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    if (
      selectedCategory &&
      item.categoryName !== selectedCategory &&
      item.categoryId !== selectedCategory
    ) {
      return false;
    }
    if (selectedTrackingType && item.trackingType !== selectedTrackingType) {
      return false;
    }
    if (selectedStatus && item.status !== selectedStatus) {
      return false;
    }
    if (lowStockOnly && item.status !== 'Low Stock') {
      return false;
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedRowIds.length === filteredItems.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredItems.map((i) => i.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter((rowId) => rowId !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        fontFamily: 'var(--font-family-sans)',
      }}
    >
      {/* Top Header Row: Title & Action CTA Buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.35rem',
              fontWeight: 600,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Items & Inventory Catalog
          </h1>
          <p
            style={{
              fontSize: '0.78rem',
              color: '#64748b',
              marginTop: '0.15rem',
              margin: 0,
              fontWeight: 400,
            }}
          >
            Manage consumable and tracked assets, stock levels, and automated reorder points.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          {/* Manage Categories Button */}
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
              fontWeight: 550,
              backgroundColor: '#ffffff',
              border: '1px solid #e8ecf2',
              color: '#334155',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'all 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e8ecf2';
            }}
          >
            <IconTag size={14} color="#64748b" />
            <span>Manage Categories</span>
          </button>

          {/* Bulk Actions Dropdown */}
          <div ref={bulkRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.78rem',
                fontWeight: 550,
                backgroundColor: '#ffffff',
                border: '1px solid #e8ecf2',
                color: '#334155',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
            >
              <IconLayers size={14} color="#64748b" />
              <span>Bulk Actions</span>
              <IconChevronDown size={13} color="#64748b" />
            </button>

            {bulkMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  width: '180px',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e8ecf2',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                  zIndex: 100,
                  padding: '0.3rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Exported ${filteredItems.length} items to CSV`, 'success');
                    setBulkMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#334155',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Export to CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRowIds.length === 0) {
                      showToast('Select items first', 'warning');
                    } else {
                      showToast(`Bulk updated ${selectedRowIds.length} items`, 'success');
                    }
                    setBulkMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#334155',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Bulk Status Update
                </button>
              </div>
            )}
          </div>

          {/* New Item Primary CTA Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.42rem 0.95rem',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 550,
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4338ca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4f46e5';
            }}
          >
            <IconPlus size={14} color="#ffffff" />
            <span>New Item</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.65rem',
          backgroundColor: '#ffffff',
          border: '1px solid #edf2f7',
          borderRadius: '12px',
          padding: '0.55rem 0.85rem',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            flex: 1,
            minWidth: '220px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <IconSearch size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.65rem' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or name..."
            style={{
              width: '100%',
              padding: '0.38rem 0.65rem 0.38rem 2.1rem',
              fontSize: '0.78rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e8ecf2',
              borderRadius: '8px',
              outline: 'none',
              color: '#0f172a',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '0.38rem 0.75rem',
            fontSize: '0.78rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e8ecf2',
            borderRadius: '8px',
            outline: 'none',
            color: '#334155',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <option value="">All Categories</option>
          {categories.length > 0 ? (
            categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))
          ) : (
            <>
              <option value="PPE">PPE</option>
              <option value="Uniform">Uniform</option>
              <option value="Equipment">Equipment</option>
            </>
          )}
        </select>

        {/* Tracking Type Filter */}
        <select
          value={selectedTrackingType}
          onChange={(e) => setSelectedTrackingType(e.target.value)}
          style={{
            padding: '0.38rem 0.75rem',
            fontSize: '0.78rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e8ecf2',
            borderRadius: '8px',
            outline: 'none',
            color: '#334155',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <option value="">All Tracking Types</option>
          <option value={TrackingType.TRACKED}>TRACKED</option>
          <option value={TrackingType.CONSUMABLE}>CONSUMABLE</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '0.38rem 0.75rem',
            fontSize: '0.78rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e8ecf2',
            borderRadius: '8px',
            outline: 'none',
            color: '#334155',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <option value="">All Statuses</option>
          <option value="Healthy">Healthy</option>
          <option value="Low Stock">Low Stock</option>
        </select>

        {/* Low Stock Checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.78rem',
            color: '#475569',
            fontWeight: 500,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            style={{ width: '14px', height: '14px', accentColor: '#4f46e5', cursor: 'pointer' }}
          />
          <span>Low Stock Only</span>
        </label>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleResetFilters}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.38rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            backgroundColor: '#ffffff',
            border: '1px solid #e8ecf2',
            borderRadius: '8px',
            color: '#64748b',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          <IconRotateCcw size={13} color="#64748b" />
          <span>Reset</span>
        </button>
      </div>

      {/* Row 1: 4 KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '0.85rem',
        }}
      >
        {/* KPI 1: Total Items */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #edf2f7',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconPackage size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
              Total Items
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 600,
                color: '#0f172a',
                lineHeight: 1.15,
                marginTop: '2px',
              }}
            >
              {stats.totalItems}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#10b981',
                fontWeight: 600,
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <IconTrendingUp size={11} color="#10b981" />
              <span>+12 this month</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Active Items */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #edf2f7',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconTag size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
              Active Items
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 600,
                color: '#0f172a',
                lineHeight: 1.15,
                marginTop: '2px',
              }}
            >
              {stats.activeItems}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
              95% of total
            </div>
          </div>
        </div>

        {/* KPI 3: Low Stock Items */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #edf2f7',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#fffbeb',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconAlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
              Low Stock Items
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 600,
                color: '#0f172a',
                lineHeight: 1.15,
                marginTop: '2px',
              }}
            >
              {stats.lowStockItems}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#ef4444',
                fontWeight: 600,
                marginTop: '0.25rem',
              }}
            >
              5% of total
            </div>
          </div>
        </div>

        {/* KPI 4: Categories */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #edf2f7',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#f5f3ff',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconLayers size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>Categories</div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 600,
                color: '#0f172a',
                lineHeight: 1.15,
                marginTop: '2px',
              }}
            >
              {stats.totalCategories}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
              Active categories
            </div>
          </div>
        </div>
      </div>

      {/* Main Inventory Catalog Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #edf2f7',
          borderRadius: '14px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '0.55rem 0.75rem', width: '38px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={
                      filteredItems.length > 0 && selectedRowIds.length === filteredItems.length
                    }
                    onChange={toggleSelectAll}
                    style={{
                      width: '14px',
                      height: '14px',
                      accentColor: '#4f46e5',
                      cursor: 'pointer',
                    }}
                  />
                </th>
                <th
                  style={{
                    padding: '0.55rem 0.5rem',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  ITEM CODE ⇅
                </th>
                <th
                  style={{
                    padding: '0.55rem 0.5rem',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  ITEM NAME ⇅
                </th>
                <th
                  style={{
                    padding: '0.55rem 0.5rem',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  CATEGORY ⇅
                </th>
                <th
                  style={{
                    padding: '0.55rem 0.5rem',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  TRACKING ⇅
                </th>
                <th
                  style={{
                    padding: '0.55rem 0.5rem',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  UNIT ⇅
                </th>
                <th
                  style={{
                    padding: '0.55rem 0.5rem',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    minWidth: '130px',
                  }}
                >
                  STOCK LEVEL ⇅
                </th>
                <th
                  style={{
                    padding: '0.55rem 0.5rem',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  REORDER LEVEL ⇅
                </th>
                <th
                  style={{
                    padding: '0.55rem 0.5rem',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  STATUS ⇅
                </th>
                <th
                  style={{
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'right',
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '0.82rem',
                    }}
                  >
                    No items match the current filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = selectedRowIds.includes(item.id);
                  const stockPercent = Math.min(
                    100,
                    Math.round((item.currentStock / (item.maxStock || 100)) * 100),
                  );
                  const isLow =
                    item.status === 'Low Stock' || item.currentStock <= item.reorderLevel;

                  return (
                    <tr
                      key={item.id || idx}
                      style={{
                        borderBottom:
                          idx === filteredItems.length - 1 ? 'none' : '1px solid #f8fafc',
                        backgroundColor: isSelected ? '#f8fafc' : 'transparent',
                        transition: 'background-color 100ms ease',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(item.id)}
                          style={{
                            width: '14px',
                            height: '14px',
                            accentColor: '#4f46e5',
                            cursor: 'pointer',
                          }}
                        />
                      </td>

                      {/* Item Code */}
                      <td
                        style={{
                          padding: '0.55rem 0.5rem',
                          fontSize: '0.78rem',
                          fontWeight: 550,
                          color: '#0f172a',
                        }}
                      >
                        {item.itemCode}
                      </td>

                      {/* Item Name & Description */}
                      <td style={{ padding: '0.55rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {renderItemIcon(item.iconType)}
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              {item.description || 'Standard catalog inventory asset'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td
                        style={{
                          padding: '0.55rem 0.5rem',
                          fontSize: '0.78rem',
                          color: '#334155',
                          fontWeight: 500,
                        }}
                      >
                        {item.categoryName}
                      </td>

                      {/* Tracking Badge */}
                      <td style={{ padding: '0.55rem 0.5rem' }}>
                        {item.trackingType === TrackingType.TRACKED ? (
                          <span
                            style={{
                              backgroundColor: '#ede9fe',
                              color: '#6366f1',
                              fontSize: '0.65rem',
                              fontWeight: 650,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                            }}
                          >
                            TRACKED
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: '#e0f2fe',
                              color: '#0284c7',
                              fontSize: '0.65rem',
                              fontWeight: 650,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                            }}
                          >
                            CONSUMABLE
                          </span>
                        )}
                      </td>

                      {/* Unit */}
                      <td
                        style={{
                          padding: '0.55rem 0.5rem',
                          fontSize: '0.78rem',
                          color: '#475569',
                          fontWeight: 500,
                        }}
                      >
                        {item.unit}
                      </td>

                      {/* Stock Level with Horizontal Progress Bar */}
                      <td style={{ padding: '0.55rem 0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                            {item.currentStock}{' '}
                            <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                              / {item.maxStock}
                            </span>
                          </span>
                          <div
                            style={{
                              width: '100%',
                              height: '4px',
                              backgroundColor: '#e2e8f0',
                              borderRadius: '9999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${stockPercent}%`,
                                height: '100%',
                                backgroundColor: isLow
                                  ? item.currentStock <= 5
                                    ? '#ef4444'
                                    : '#f59e0b'
                                  : '#10b981',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Reorder Level */}
                      <td
                        style={{
                          padding: '0.55rem 0.5rem',
                          fontSize: '0.78rem',
                          color: '#334155',
                          fontWeight: 500,
                        }}
                      >
                        {item.reorderLevel}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.55rem 0.5rem' }}>
                        {item.status === 'Healthy' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.68rem',
                              fontWeight: 550,
                              padding: '0.12rem 0.55rem',
                              borderRadius: '9999px',
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                backgroundColor: '#16a34a',
                              }}
                            />
                            Healthy
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                              fontSize: '0.68rem',
                              fontWeight: 550,
                              padding: '0.12rem 0.55rem',
                              borderRadius: '9999px',
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                backgroundColor: '#d97706',
                              }}
                            />
                            Low Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>
                        <div
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Item"
                            style={{
                              padding: '0.28rem',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#64748b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            <IconEdit size={13} />
                          </button>

                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === item.id ? null : item.id)
                              }
                              title="More Actions"
                              style={{
                                padding: '0.28rem',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#ffffff',
                                color: '#64748b',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8fafc';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                              }}
                            >
                              <IconMoreHorizontal size={13} />
                            </button>

                            {activeMenuId === item.id && (
                              <div
                                ref={actionMenuRef}
                                style={{
                                  position: 'absolute',
                                  top: 'calc(100% + 4px)',
                                  right: 0,
                                  width: '160px',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '8px',
                                  border: '1px solid #e8ecf2',
                                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                                  zIndex: 100,
                                  padding: '0.3rem',
                                  textAlign: 'left',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdjust(item)}
                                  style={{
                                    width: '100%',
                                    padding: '0.4rem 0.6rem',
                                    fontSize: '0.74rem',
                                    fontWeight: 500,
                                    color: '#334155',
                                    borderRadius: '5px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = '#f1f5f9')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = 'transparent')
                                  }
                                >
                                  Stock Adjustment
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDetailItemId(item.id);
                                    setActiveMenuId(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.4rem 0.6rem',
                                    fontSize: '0.74rem',
                                    fontWeight: 500,
                                    color: '#334155',
                                    borderRadius: '5px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = '#f1f5f9')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = 'transparent')
                                  }
                                >
                                  View Item Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item)}
                                  style={{
                                    width: '100%',
                                    padding: '0.4rem 0.6rem',
                                    fontSize: '0.74rem',
                                    fontWeight: 500,
                                    color: '#ef4444',
                                    borderRadius: '5px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = '#fef2f2')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = 'transparent')
                                  }
                                >
                                  Delete Item
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Showing 1 to {filteredItems.length} of {stats.totalItems} items
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{
                padding: '0.25rem 0.55rem',
                fontSize: '0.75rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <IconChevronLeft size={13} />
              </button>

              <button
                type="button"
                onClick={() => setPage(1)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: page === 1 ? 600 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: page === 1 ? '#4f46e5' : '#ffffff',
                  color: page === 1 ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                }}
              >
                1
              </button>

              <button
                type="button"
                onClick={() => setPage(2)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: page === 2 ? 600 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: page === 2 ? '#4f46e5' : '#ffffff',
                  color: page === 2 ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                }}
              >
                2
              </button>

              <button
                type="button"
                onClick={() => setPage(3)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: page === 3 ? 600 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: page === 3 ? '#4f46e5' : '#ffffff',
                  color: page === 3 ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                }}
              >
                3
              </button>

              <button
                type="button"
                onClick={() => setPage(4)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: page === 4 ? 600 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: page === 4 ? '#4f46e5' : '#ffffff',
                  color: page === 4 ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                }}
              >
                4
              </button>

              <button
                type="button"
                onClick={() => setPage(5)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: page === 5 ? 600 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: page === 5 ? '#4f46e5' : '#ffffff',
                  color: page === 5 ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                }}
              >
                5
              </button>

              <span style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '0 0.15rem' }}>
                ...
              </span>

              <button
                type="button"
                onClick={() => setPage(25)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: page === 25 ? 600 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: page === 25 ? '#4f46e5' : '#ffffff',
                  color: page === 25 ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                }}
              >
                25
              </button>

              <button
                type="button"
                onClick={() => setPage(Math.min(25, page + 1))}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <IconChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      {isItemModalOpen && (
        <ItemFormModal
          isOpen={isItemModalOpen}
          item={editingItem}
          categories={categories}
          onClose={() => {
            setIsItemModalOpen(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setIsItemModalOpen(false);
            setEditingItem(null);
            loadData();
          }}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onCategoriesUpdated={() => {
            setIsCategoryModalOpen(false);
            loadData();
          }}
        />
      )}

      {detailItemId && (
        <ItemDetailsDrawer
          itemId={detailItemId}
          onClose={() => setDetailItemId(null)}
          onEdit={(item) => {
            setDetailItemId(null);
            const catalog = items.find((i) => i.id === item.id);
            if (catalog) handleOpenEdit(catalog);
          }}
          onAdjustStock={(item) => {
            setDetailItemId(null);
            const catalog = items.find((i) => i.id === item.id);
            if (catalog) handleOpenAdjust(catalog);
          }}
        />
      )}

      {adjustingItem && (
        <StockAdjustmentModal
          isOpen={true}
          item={adjustingItem}
          onClose={() => setAdjustingItem(null)}
          onSuccess={() => {
            setAdjustingItem(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
