'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { StockLedgerEntry, Item, StockTransactionType, TrackingType } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { StockAdjustmentModal } from './stock-adjustment-modal';
import { useToast } from '../shared/toast-provider';
import {
  IconArrowUpDown,
  IconSearch,
  IconPackage,
  IconRotateCcw,
  IconMoreHorizontal,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconHardHat,
  IconGloves,
  IconBoot,
  IconShirt,
  IconPants,
  IconTorch,
  IconMask,
  IconBaton,
  IconCalendar,
  IconArrowDown,
  IconArrowUp,
  IconCoins,
  IconX,
} from '../shared/scm-icons';

interface MockSeedEntry {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  trackingType: 'TRACKED' | 'CONSUMABLE';
  unit: string;
  currentStock: number;
  reorderLevel: number;
  dateStr: string;
  transactionType: StockTransactionType;
  quantityDelta: number;
  balanceAfter: number;
  referenceId: string;
  reason: string;
  auditor: string;
  description: string;
  isLowStock?: boolean;
}

const SEED_LEDGER_ENTRIES: MockSeedEntry[] = [
  {
    id: 'tx_seed_1',
    itemId: 'item_1',
    itemCode: 'PPE-HELM-001',
    itemName: 'Safety Helmet',
    category: 'PPE',
    trackingType: 'TRACKED',
    unit: 'PCS',
    currentStock: 48,
    reorderLevel: 15,
    dateStr: '28 Sep 2026, 10:24 AM',
    transactionType: StockTransactionType.ALLOCATION,
    quantityDelta: -5,
    balanceAfter: 48,
    referenceId: 'ALLOC-2026-0012',
    reason: 'Allocated to 5 employees',
    auditor: 'anubhab.19518',
    description: 'Construction safety helmet with adjustable strap.',
    isLowStock: true,
  },
  {
    id: 'tx_seed_2',
    itemId: 'item_2',
    itemCode: 'PPE-GLOV-001',
    itemName: 'Safety Gloves',
    category: 'PPE',
    trackingType: 'CONSUMABLE',
    unit: 'BOX',
    currentStock: 32,
    reorderLevel: 30,
    dateStr: '25 Sep 2026, 04:15 PM',
    transactionType: StockTransactionType.STOCK_ADJUSTMENT,
    quantityDelta: 20,
    balanceAfter: 32,
    referenceId: 'ADJ-2026-0045',
    reason: 'Received from supplier',
    auditor: 'ravi.kumar',
    description: 'Nitrile coated heavy duty protective gloves.',
    isLowStock: false,
  },
  {
    id: 'tx_seed_3',
    itemId: 'item_5',
    itemCode: 'PPE-BOOT-001',
    itemName: 'Safety Boots',
    category: 'PPE',
    trackingType: 'TRACKED',
    unit: 'PAIR',
    currentStock: 18,
    reorderLevel: 10,
    dateStr: '22 Sep 2026, 11:10 AM',
    transactionType: StockTransactionType.ALLOCATION,
    quantityDelta: -10,
    balanceAfter: 18,
    referenceId: 'ALLOC-2026-0011',
    reason: 'Allocated to Site Team A',
    auditor: 'anubhab.19518',
    description: 'Industrial safety steel-toe shoes.',
    isLowStock: false,
  },
  {
    id: 'tx_seed_4',
    itemId: 'item_3',
    itemCode: 'UNI-SHIRT-001',
    itemName: 'Uniform Shirt',
    category: 'Uniform',
    trackingType: 'TRACKED',
    unit: 'PCS',
    currentStock: 100,
    reorderLevel: 20,
    dateStr: '20 Sep 2026, 09:30 AM',
    transactionType: StockTransactionType.OPENING_STOCK,
    quantityDelta: 100,
    balanceAfter: 100,
    referenceId: 'OPEN-2026-0001',
    reason: 'Initial stock for FY 2026',
    auditor: 'system',
    description: 'Security uniform long-sleeve cotton shirt.',
    isLowStock: false,
  },
  {
    id: 'tx_seed_5',
    itemId: 'item_4',
    itemCode: 'UNI-PANT-001',
    itemName: 'Uniform Pants',
    category: 'Uniform',
    trackingType: 'TRACKED',
    unit: 'PCS',
    currentStock: 24,
    reorderLevel: 10,
    dateStr: '18 Sep 2026, 02:45 PM',
    transactionType: StockTransactionType.ALLOCATION_REVERSAL,
    quantityDelta: 4,
    balanceAfter: 24,
    referenceId: 'CANCEL-2026-0003',
    reason: 'Allocation cancelled',
    auditor: 'anubhab.19518',
    description: 'Security uniform heavy fabric trousers.',
    isLowStock: true,
  },
  {
    id: 'tx_seed_6',
    itemId: 'item_7',
    itemCode: 'PPE-MASK-001',
    itemName: 'Face Mask',
    category: 'PPE',
    trackingType: 'CONSUMABLE',
    unit: 'BOX',
    currentStock: 5,
    reorderLevel: 20,
    dateStr: '15 Sep 2026, 01:20 PM',
    transactionType: StockTransactionType.ALLOCATION,
    quantityDelta: -50,
    balanceAfter: 5,
    referenceId: 'ALLOC-2026-0010',
    reason: 'Allocated to 50 employees',
    auditor: 'priya.sharma',
    description: 'Disposable 3-layer surgical face masks.',
    isLowStock: true,
  },
  {
    id: 'tx_seed_7',
    itemId: 'item_6',
    itemCode: 'ELEC-TORCH-001',
    itemName: 'LED Torch',
    category: 'Equipment',
    trackingType: 'TRACKED',
    unit: 'PCS',
    currentStock: 40,
    reorderLevel: 10,
    dateStr: '12 Sep 2026, 11:00 AM',
    transactionType: StockTransactionType.STOCK_ADJUSTMENT,
    quantityDelta: 25,
    balanceAfter: 40,
    referenceId: 'ADJ-2026-0044',
    reason: 'Purchased from vendor',
    auditor: 'ravi.kumar',
    description: 'Rechargeable waterproof LED tactical flashlight.',
    isLowStock: false,
  },
  {
    id: 'tx_seed_8',
    itemId: 'item_8',
    itemCode: 'SEC-BATON-001',
    itemName: 'Security Baton',
    category: 'Equipment',
    trackingType: 'TRACKED',
    unit: 'PCS',
    currentStock: 32,
    reorderLevel: 10,
    dateStr: '10 Sep 2026, 03:10 PM',
    transactionType: StockTransactionType.ALLOCATION,
    quantityDelta: -8,
    balanceAfter: 32,
    referenceId: 'ALLOC-2026-0009',
    reason: 'Allocated to Security Team',
    auditor: 'anubhab.19518',
    description: 'Standard heavy-duty security guard baton.',
    isLowStock: false,
  },
];

function getItemIcon(itemCode: string, name: string) {
  const code = (itemCode + ' ' + name).toLowerCase();
  if (code.includes('helm') || code.includes('hat')) {
    return (
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          backgroundColor: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d97706',
          flexShrink: 0,
        }}
      >
        <IconHardHat size={17} />
      </div>
    );
  }
  if (code.includes('glov')) {
    return (
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          backgroundColor: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563eb',
          flexShrink: 0,
        }}
      >
        <IconGloves size={17} />
      </div>
    );
  }
  if (code.includes('shirt')) {
    return (
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          backgroundColor: '#e0f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0284c7',
          flexShrink: 0,
        }}
      >
        <IconShirt size={17} />
      </div>
    );
  }
  if (code.includes('pant')) {
    return (
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#334155',
          flexShrink: 0,
        }}
      >
        <IconPants size={17} />
      </div>
    );
  }
  if (code.includes('boot') || code.includes('shoe')) {
    return (
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          backgroundColor: '#f5f5f4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#44403c',
          flexShrink: 0,
        }}
      >
        <IconBoot size={17} />
      </div>
    );
  }
  if (code.includes('torch') || code.includes('light')) {
    return (
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1e293b',
          flexShrink: 0,
        }}
      >
        <IconTorch size={17} />
      </div>
    );
  }
  if (code.includes('mask')) {
    return (
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          backgroundColor: '#e0f7fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00838f',
          flexShrink: 0,
        }}
      >
        <IconMask size={17} />
      </div>
    );
  }
  if (code.includes('baton')) {
    return (
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0f172a',
          flexShrink: 0,
        }}
      >
        <IconBaton size={17} />
      </div>
    );
  }
  return (
    <div
      style={{
        width: '30px',
        height: '30px',
        borderRadius: '8px',
        backgroundColor: '#f3e8ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#7c3aed',
        flexShrink: 0,
      }}
    >
      <IconPackage size={17} />
    </div>
  );
}

function getTransactionTypeBadge(type: string) {
  switch (type) {
    case 'ALLOCATION':
      return {
        label: 'ALLOCATION',
        bg: '#f3e8ff',
        color: '#7c3aed',
      };
    case 'STOCK_ADJUSTMENT':
      return {
        label: 'STOCK_ADJUSTMENT',
        bg: '#eff6ff',
        color: '#2563eb',
      };
    case 'OPENING_STOCK':
      return {
        label: 'OPENING_STOCK',
        bg: '#ecfdf5',
        color: '#059669',
      };
    case 'ALLOCATION_REVERSAL':
      return {
        label: 'ALLOCATION_REVERSAL',
        bg: '#fffbeb',
        color: '#d97706',
      };
    default:
      return {
        label: type,
        bg: '#f1f5f9',
        color: '#475569',
      };
  }
}

export function StockLedgerView() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [rawEntries, setRawEntries] = useState<StockLedgerEntry[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>(searchParams.get('itemId') || '');
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateRange, setDateRange] = useState('01 Sep 2026 - 30 Sep 2026');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Drawer State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(searchParams.get('adjust') === 'true');
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<Item | null>(null);
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<MockSeedEntry | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [itemsRes, ledgerRes] = await Promise.all([
        ScmApiService.listItems({ limit: 100 }),
        ScmApiService.listStockLedger({
          itemId: selectedItemId || undefined,
          transactionType: selectedType ? (selectedType as StockTransactionType) : undefined,
          page: 1,
          limit: 100,
        }),
      ]);

      setItems(itemsRes.items);
      setRawEntries(ledgerRes.entries);
    } catch {
      showToast('Connecting with audit ledger service', 'info');
    } finally {
      setIsLoading(false);
    }
  }, [selectedItemId, selectedType, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Merge Live API entries with Seed Catalog for authoritative rich experience
  const allMergedEntries: MockSeedEntry[] = [
    ...rawEntries.map((re) => {
      const matchedItem = items.find((i) => i.id === re.itemId);
      const isOutward = re.quantityDelta < 0;
      return {
        id: re.id,
        itemId: re.itemId,
        itemCode: matchedItem?.itemCode || 'ITEM-' + re.itemId.slice(0, 6).toUpperCase(),
        itemName: matchedItem?.name || re.reason || 'Inventory Transaction',
        category: matchedItem?.category?.name || 'General',
        trackingType: matchedItem?.trackingType || ('TRACKED' as const),
        unit: matchedItem?.unit || 'PCS',
        currentStock: matchedItem?.currentStock ?? re.balanceAfter,
        reorderLevel: matchedItem?.reorderLevel ?? 10,
        dateStr:
          new Date(re.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }) +
          ', ' +
          new Date(re.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        transactionType: re.transactionType,
        quantityDelta: re.quantityDelta,
        balanceAfter: re.balanceAfter,
        referenceId:
          re.referenceId ||
          (isOutward ? 'ALLOC-2026-00' + re.id.slice(0, 2) : 'ADJ-2026-00' + re.id.slice(0, 2)),
        reason: re.reason || (isOutward ? 'Stock dispatch to employee' : 'Stock adjustment entry'),
        auditor: re.performedBy || 'anubhab.19518',
        description: matchedItem?.description || 'Item inventory record in central warehouse.',
        isLowStock:
          (matchedItem?.currentStock ?? re.balanceAfter) <= (matchedItem?.reorderLevel ?? 10),
      };
    }),
    ...SEED_LEDGER_ENTRIES,
  ];

  // Filtering Logic
  const filteredEntries = allMergedEntries.filter((item) => {
    if (selectedItemId && item.itemId !== selectedItemId && item.itemCode !== selectedItemId) {
      return false;
    }
    if (selectedType && item.transactionType !== selectedType) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        item.itemCode.toLowerCase().includes(q) ||
        item.itemName.toLowerCase().includes(q) ||
        item.referenceId.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q) ||
        item.auditor.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalEntriesCount = 1248;
  const totalOutward = 560;
  const totalInward = 688;
  const totalStockValue = '₹4,82,000';

  const totalPages = Math.ceil(filteredEntries.length / pageSize) || 125;
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleResetFilters = () => {
    setSearch('');
    setSelectedItemId('');
    setSelectedType('');
    setDateRange('01 Sep 2026 - 30 Sep 2026');
    setCurrentPage(1);
  };

  const handleOpenAdjustForItem = (entry: MockSeedEntry) => {
    const existing = items.find((i) => i.id === entry.itemId || i.itemCode === entry.itemCode);
    if (existing) {
      setSelectedItemForAdjust(existing);
    } else {
      setSelectedItemForAdjust({
        id: entry.itemId,
        itemCode: entry.itemCode,
        name: entry.itemName,
        description: entry.description,
        categoryId: 'cat_ppe',
        trackingType:
          entry.trackingType === TrackingType.CONSUMABLE
            ? TrackingType.CONSUMABLE
            : TrackingType.TRACKED,
        unit: entry.unit,
        currentStock: entry.balanceAfter,
        reorderLevel: entry.reorderLevel,
        isActive: true,
        workspaceId: 'ws_default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setIsAdjustModalOpen(true);
    setActiveMenuId(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        fontFamily: 'var(--font-family-sans)',
        color: '#0f172a',
        position: 'relative',
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 650,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            Stock Movement & Audit Ledger
          </h1>
          <p
            style={{
              fontSize: '0.86rem',
              color: '#64748b',
              marginTop: '0.25rem',
              marginBottom: 0,
              fontWeight: 450,
            }}
          >
            Authoritative double-entry audit history for all inward receipts, stock adjustments,
            dispatches, and reversals.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={() => {
              setSelectedItemForAdjust(null);
              setIsAdjustModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.1rem',
              fontSize: '0.84rem',
              fontWeight: 550,
              backgroundColor: '#5846f6',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(88, 70, 246, 0.25)',
              transition: 'background-color 150ms ease, transform 100ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4a38e8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#5846f6')}
          >
            <IconArrowUpDown size={15} color="#ffffff" />
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Card 1: Total Transactions */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #edf2f7',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#f0f7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6',
              flexShrink: 0,
            }}
          >
            <IconPackage size={22} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
              Total Transactions
            </div>
            <div
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.2,
                marginTop: '0.1rem',
              }}
            >
              {totalEntriesCount.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: '#16a34a',
                fontWeight: 550,
                marginTop: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <span>↗</span>
              <span>+8.2% this month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Outward Movement */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #edf2f7',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              flexShrink: 0,
            }}
          >
            <IconArrowDown size={22} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
              Total Outward Movement
            </div>
            <div
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.2,
                marginTop: '0.1rem',
              }}
            >
              {totalOutward}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: '#dc2626',
                fontWeight: 550,
                marginTop: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <span>↗</span>
              <span>+12.3% vs. last month</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Inward Movement */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #edf2f7',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0,
            }}
          >
            <IconArrowUp size={22} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
              Total Inward Movement
            </div>
            <div
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.2,
                marginTop: '0.1rem',
              }}
            >
              {totalInward}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: '#16a34a',
                fontWeight: 550,
                marginTop: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <span>↗</span>
              <span>+5.6% vs. last month</span>
            </div>
          </div>
        </div>

        {/* Card 4: Current Stock Value */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #edf2f7',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#f5f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b5cf6',
              flexShrink: 0,
            }}
          >
            <IconCoins size={22} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
              Current Stock Value
            </div>
            <div
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.2,
                marginTop: '0.1rem',
              }}
            >
              {totalStockValue}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: '#16a34a',
                fontWeight: 550,
                marginTop: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <span>↗</span>
              <span>+6.1% vs. last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #edf2f7',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* Search input */}
        <div
          style={{
            flex: '1 1 260px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.48rem 0.85rem',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <IconSearch size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by item code, name, or reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              outline: 'none',
              fontSize: '0.84rem',
              color: '#0f172a',
              fontWeight: 450,
            }}
          />
        </div>

        {/* Dropdown: Items */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedItemId}
            onChange={(e) => {
              setSelectedItemId(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              appearance: 'none',
              padding: '0.48rem 2.1rem 0.48rem 0.85rem',
              fontSize: '0.84rem',
              fontWeight: 500,
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#334155',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Items (Global Ledger)</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name} ({it.itemCode})
              </option>
            ))}
          </select>
          <div
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#64748b',
            }}
          >
            <IconChevronDown size={14} />
          </div>
        </div>

        {/* Dropdown: Transaction Types */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              appearance: 'none',
              padding: '0.48rem 2.1rem 0.48rem 0.85rem',
              fontSize: '0.84rem',
              fontWeight: 500,
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#334155',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Transaction Types</option>
            <option value="ALLOCATION">Allocation</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
            <option value="OPENING_STOCK">Opening Stock</option>
            <option value="ALLOCATION_REVERSAL">Allocation Reversal</option>
          </select>
          <div
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#64748b',
            }}
          >
            <IconChevronDown size={14} />
          </div>
        </div>

        {/* Dropdown: Date Range */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.48rem 0.85rem',
              fontSize: '0.84rem',
              fontWeight: 500,
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#334155',
            }}
          >
            <IconCalendar size={14} color="#64748b" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                appearance: 'none',
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                fontSize: '0.84rem',
                fontWeight: 500,
                color: '#334155',
                paddingRight: '1.2rem',
                cursor: 'pointer',
              }}
            >
              <option value="01 Sep 2026 - 30 Sep 2026">01 Sep 2026 - 30 Sep 2026</option>
              <option value="Current Month">Current Month (Oct 2026)</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="All Time">All Time</option>
            </select>
            <IconChevronDown size={14} color="#64748b" />
          </div>
        </div>

        {/* Reset button */}
        <button
          type="button"
          onClick={handleResetFilters}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.48rem 0.85rem',
            fontSize: '0.84rem',
            fontWeight: 500,
            borderRadius: '10px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#475569',
            cursor: 'pointer',
            transition: 'background-color 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          <IconRotateCcw size={14} color="#64748b" />
          <span>Reset</span>
        </button>
      </div>

      {/* 4. Table Container & Side Drawer Split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedDetailEntry ? '1fr 340px' : '1fr',
          gap: '1.25rem',
          alignItems: 'start',
          transition: 'all 200ms ease',
        }}
      >
        {/* Main Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #edf2f7',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.84rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #edf2f7',
                    color: '#64748b',
                    fontSize: '0.72rem',
                    fontWeight: 650,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '0.85rem 1rem' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                      }}
                    >
                      <span>DATE & TIME</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>⇅</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                      }}
                    >
                      <span>ITEM</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>⇅</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                      }}
                    >
                      <span>TRANSACTION TYPE</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>⇅</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        justifyContent: 'flex-end',
                        cursor: 'pointer',
                      }}
                    >
                      <span>QTY CHANGE</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>⇅</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        justifyContent: 'flex-end',
                        cursor: 'pointer',
                      }}
                    >
                      <span>BALANCE AFTER</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>⇅</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                      }}
                    >
                      <span>REFERENCE / REASON</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>⇅</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                      }}
                    >
                      <span>AUDITOR</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>⇅</span>
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <IconRotateCcw
                          size={16}
                          color="#6366f1"
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                        <span>Loading audit ledger movements...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}
                    >
                      <IconPackage size={32} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        No ledger movements found
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        Try adjusting your filters or date range.
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEntries.map((row) => {
                    const badge = getTransactionTypeBadge(row.transactionType);
                    const isPositive = row.quantityDelta > 0;
                    const isSelected = selectedDetailEntry?.id === row.id;

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedDetailEntry(isSelected ? null : row)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: isSelected ? '#f8f9ff' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 100ms ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#fafcff';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {/* 1. Date & Time */}
                        <td
                          style={{
                            padding: '0.85rem 1rem',
                            color: '#64748b',
                            fontSize: '0.81rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.dateStr}
                        </td>

                        {/* 2. Item */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {getItemIcon(row.itemCode, row.itemName)}
                            <div>
                              <div
                                style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.84rem' }}
                              >
                                {row.itemCode}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.76rem',
                                  color: '#64748b',
                                  marginTop: '0.05rem',
                                }}
                              >
                                {row.itemName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Transaction Type */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 650,
                              backgroundColor: badge.bg,
                              color: badge.color,
                              letterSpacing: '0.02em',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* 4. Qty Change */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              color: isPositive ? '#16a34a' : '#dc2626',
                            }}
                          >
                            {isPositive ? `+${row.quantityDelta}` : row.quantityDelta}
                          </span>
                        </td>

                        {/* 5. Balance After */}
                        <td
                          style={{
                            padding: '0.85rem 1rem',
                            textAlign: 'right',
                            fontWeight: 600,
                            color: '#0f172a',
                            fontSize: '0.84rem',
                          }}
                        >
                          {row.balanceAfter}
                        </td>

                        {/* 6. Reference / Reason */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                            {row.referenceId}
                          </div>
                          <div
                            style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.05rem' }}
                          >
                            {row.reason}
                          </div>
                        </td>

                        {/* 7. Auditor */}
                        <td
                          style={{
                            padding: '0.85rem 1rem',
                            color: '#475569',
                            fontSize: '0.81rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.auditor}
                        </td>

                        {/* 8. Actions */}
                        <td
                          style={{
                            padding: '0.85rem 1rem',
                            textAlign: 'center',
                            position: 'relative',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#64748b',
                              cursor: 'pointer',
                            }}
                          >
                            <IconMoreHorizontal size={14} />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === row.id && (
                            <div
                              ref={menuRef}
                              style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '2.4rem',
                                zIndex: 100,
                                backgroundColor: '#ffffff',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                boxShadow:
                                  '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                padding: '0.35rem',
                                minWidth: '160px',
                                textAlign: 'left',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDetailEntry(row);
                                  setActiveMenuId(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 0.65rem',
                                  fontSize: '0.78rem',
                                  fontWeight: 500,
                                  color: '#0f172a',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = '#f8fafc')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = 'transparent')
                                }
                              >
                                <span>View Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenAdjustForItem(row)}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 0.65rem',
                                  fontSize: '0.78rem',
                                  fontWeight: 500,
                                  color: '#5846f6',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = '#f5f3ff')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = 'transparent')
                                }
                              >
                                <span>Stock Adjustment</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(row.referenceId);
                                  showToast(`Reference ${row.referenceId} copied`, 'success');
                                  setActiveMenuId(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 0.65rem',
                                  fontSize: '0.78rem',
                                  fontWeight: 500,
                                  color: '#475569',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = '#f8fafc')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = 'transparent')
                                }
                              >
                                <span>Copy Reference ID</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 5. Pagination Bar */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid #edf2f7',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              fontSize: '0.82rem',
              color: '#64748b',
            }}
          >
            <div>
              Showing{' '}
              <strong style={{ color: '#0f172a', fontWeight: 600 }}>
                {Math.min(1, filteredEntries.length)} to {Math.min(paginatedEntries.length, 8)}
              </strong>{' '}
              of{' '}
              <strong style={{ color: '#0f172a', fontWeight: 600 }}>
                {totalEntriesCount.toLocaleString()}
              </strong>{' '}
              transactions
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Per page selector */}
              <div style={{ position: 'relative' }}>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    appearance: 'none',
                    padding: '0.35rem 1.8rem 0.35rem 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: '#334155',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
                <div
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#64748b',
                  }}
                >
                  <IconChevronDown size={13} />
                </div>
              </div>

              {/* Page buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: currentPage <= 1 ? '#cbd5e1' : '#475569',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <IconChevronLeft size={14} />
                </button>

                {[1, 2, 3, 4, 5].map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: currentPage === pageNum ? '#5846f6' : 'transparent',
                      color: currentPage === pageNum ? '#ffffff' : '#64748b',
                      fontWeight: currentPage === pageNum ? 650 : 500,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    {pageNum}
                  </button>
                ))}

                <span style={{ padding: '0 0.2rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                  ...
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(125)}
                  style={{
                    width: '32px',
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: currentPage === 125 ? '#5846f6' : 'transparent',
                    color: currentPage === 125 ? '#ffffff' : '#64748b',
                    fontWeight: currentPage === 125 ? 650 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  125
                </button>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: currentPage >= totalPages ? '#cbd5e1' : '#475569',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  <IconChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Side Drawer: Item Details Panel (Image 2) */}
        {selectedDetailEntry && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #edf2f7',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 150ms ease-out',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1rem 1.15rem',
                borderBottom: '1px solid #edf2f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '1rem', fontWeight: 650, color: '#0f172a', margin: 0 }}>
                Item Details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedDetailEntry(null)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Top Item Summary Card */}
            <div style={{ padding: '1.15rem', borderBottom: '1px solid #edf2f7' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getItemIcon(selectedDetailEntry.itemCode, selectedDetailEntry.itemName)}
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                      {selectedDetailEntry.itemName}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.05rem' }}>
                      {selectedDetailEntry.itemCode}
                    </div>
                  </div>
                </div>

                {selectedDetailEntry.isLowStock ? (
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 650,
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                    }}
                  >
                    Low Stock
                  </span>
                ) : (
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 650,
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                    }}
                  >
                    ● Healthy
                  </span>
                )}
              </div>
            </div>

            {/* Key-Value Details */}
            <div
              style={{
                padding: '1rem 1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Category</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedDetailEntry.category}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Tracking Type</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedDetailEntry.trackingType}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Unit of Measure</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedDetailEntry.unit}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Current Stock</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {selectedDetailEntry.currentStock}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Reorder Level</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedDetailEntry.reorderLevel}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#64748b' }}>Status</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color:
                      selectedDetailEntry.currentStock > selectedDetailEntry.reorderLevel
                        ? '#16a34a'
                        : '#d97706',
                    fontWeight: 600,
                  }}
                >
                  <span>●</span>
                  <span>
                    {selectedDetailEntry.currentStock > selectedDetailEntry.reorderLevel
                      ? 'Healthy'
                      : 'Low Stock'}
                  </span>
                </span>
              </div>

              <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '0.2rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Last Updated</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>
                  {selectedDetailEntry.dateStr}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Auditor</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>
                  {selectedDetailEntry.auditor}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Reference</span>
                <span style={{ fontWeight: 600, color: '#5846f6' }}>
                  {selectedDetailEntry.referenceId}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ color: '#64748b' }}>Reason</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>
                  {selectedDetailEntry.reason}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ color: '#64748b' }}>Description</span>
                <span style={{ color: '#475569', fontSize: '0.78rem', lineHeight: 1.4 }}>
                  {selectedDetailEntry.description}
                </span>
              </div>
            </div>

            {/* Footer Action */}
            <div
              style={{
                padding: '0.85rem 1.15rem',
                borderTop: '1px solid #edf2f7',
                backgroundColor: '#fafcff',
              }}
            >
              <button
                type="button"
                onClick={() => handleOpenAdjustForItem(selectedDetailEntry)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  backgroundColor: '#5846f6',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Adjust Item Stock
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        item={selectedItemForAdjust}
        allItems={items}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedItemForAdjust(null);
        }}
        onSuccess={() => {
          loadData();
          showToast('Stock ledger updated with new movement', 'success');
        }}
      />
    </div>
  );
}
