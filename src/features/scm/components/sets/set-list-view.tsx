'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ItemSet, Item } from '../../types';
import { ScmApiService, scmSetsApi, CreateSetDto } from '../../services/scm-api.service';
import { useToast } from '../shared/toast-provider';
import {
  IconPlus,
  IconSearch,
  IconPackage,
  IconChevronDown,
  IconX,
  IconRotateCcw,
  IconHardHat,
  IconGloves,
  IconBoot,
  IconShirt,
  IconPants,
  IconTorch,
  IconMask,
  IconBaton,
  IconVest,
  IconLayers,
} from '../shared/scm-icons';

interface SeedKitItem {
  id: string;
  itemId: string;
  itemCode: string;
  name: string;
  quantity: number;
  stock: number;
  isLowStock?: boolean;
}

interface SeedKit {
  id: string;
  code: string;
  name: string;
  targetRole: string;
  department: string;
  description: string;
  accentColor: 'purple' | 'amber' | 'blue';
  items: SeedKitItem[];
}

const DEFAULT_SEEDS: SeedKit[] = [
  {
    id: 'set_seed_1',
    code: 'KIT-SEC-001',
    name: 'Security Guard Kit',
    targetRole: 'Security Guard',
    department: 'Security Operations',
    description:
      'Full duty uniform and standard safety equipment bundle for active security guards.',
    accentColor: 'purple',
    items: [
      {
        id: 'si_1',
        itemId: 'item_1',
        itemCode: 'PPE-HELM-001',
        name: 'Safety Helmet',
        quantity: 1,
        stock: 8,
        isLowStock: true,
      },
      {
        id: 'si_2',
        itemId: 'item_3',
        itemCode: 'UNI-SHIRT-001',
        name: 'Uniform Shirt',
        quantity: 2,
        stock: 86,
        isLowStock: false,
      },
      {
        id: 'si_3',
        itemId: 'item_5',
        itemCode: 'PPE-BOOT-001',
        name: 'Safety Boots',
        quantity: 1,
        stock: 12,
        isLowStock: false,
      },
      {
        id: 'si_4',
        itemId: 'item_6',
        itemCode: 'ELEC-TORCH-001',
        name: 'Torch/Light',
        quantity: 1,
        stock: 40,
        isLowStock: false,
      },
      {
        id: 'si_5',
        itemId: 'item_8',
        itemCode: 'SEC-BATON-001',
        name: 'Security Baton',
        quantity: 1,
        stock: 32,
        isLowStock: false,
      },
    ],
  },
  {
    id: 'set_seed_2',
    code: 'KIT-PPE-001',
    name: 'PPE Kit',
    targetRole: 'General Workforce',
    department: 'Operations',
    description:
      'Baseline personal protection equipment required across all industrial operational zones.',
    accentColor: 'purple',
    items: [
      {
        id: 'si_6',
        itemId: 'item_1',
        itemCode: 'PPE-HELM-001',
        name: 'Safety Helmet',
        quantity: 1,
        stock: 48,
        isLowStock: false,
      },
      {
        id: 'si_7',
        itemId: 'item_2',
        itemCode: 'PPE-GLOV-001',
        name: 'Safety Gloves',
        quantity: 2,
        stock: 32,
        isLowStock: false,
      },
      {
        id: 'si_8',
        itemId: 'item_7',
        itemCode: 'PPE-MASK-001',
        name: 'Face Mask',
        quantity: 2,
        stock: 5,
        isLowStock: true,
      },
      {
        id: 'si_9',
        itemId: 'item_9',
        itemCode: 'PPE-VEST-001',
        name: 'Safety Vest',
        quantity: 1,
        stock: 54,
        isLowStock: false,
      },
    ],
  },
  {
    id: 'set_seed_3',
    code: 'KIT-HK-001',
    name: 'Housekeeping Kit',
    targetRole: 'Housekeeping Staff',
    department: 'Facilities',
    description:
      'Hygiene, sanitation, and protective garments tailored for facility management teams.',
    accentColor: 'amber',
    items: [
      {
        id: 'si_10',
        itemId: 'item_10',
        itemCode: 'HK-GLOV-001',
        name: 'Cleaning Gloves',
        quantity: 2,
        stock: 65,
        isLowStock: false,
      },
      {
        id: 'si_11',
        itemId: 'item_7',
        itemCode: 'PPE-MASK-001',
        name: 'Face Mask',
        quantity: 2,
        stock: 5,
        isLowStock: true,
      },
      {
        id: 'si_12',
        itemId: 'item_11',
        itemCode: 'HK-SHIRT-001',
        name: 'Uniform Shirt',
        quantity: 2,
        stock: 42,
        isLowStock: false,
      },
      {
        id: 'si_13',
        itemId: 'item_12',
        itemCode: 'HK-APRON-001',
        name: 'Apron',
        quantity: 1,
        stock: 28,
        isLowStock: false,
      },
      {
        id: 'si_14',
        itemId: 'item_13',
        itemCode: 'HK-SHOES-001',
        name: 'Safety Shoes',
        quantity: 1,
        stock: 19,
        isLowStock: false,
      },
      {
        id: 'si_15',
        itemId: 'item_14',
        itemCode: 'HK-SPRAY-001',
        name: 'Cleaning Spray',
        quantity: 2,
        stock: 90,
        isLowStock: false,
      },
    ],
  },
];

function getKitItemIcon(itemCode: string, name: string) {
  const code = (itemCode + ' ' + name).toLowerCase();
  if (code.includes('helm') || code.includes('hat')) {
    return (
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          backgroundColor: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d97706',
          flexShrink: 0,
        }}
      >
        <IconHardHat size={15} />
      </div>
    );
  }
  if (code.includes('glov')) {
    return (
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          backgroundColor: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563eb',
          flexShrink: 0,
        }}
      >
        <IconGloves size={15} />
      </div>
    );
  }
  if (code.includes('shirt') || code.includes('cloth')) {
    return (
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          backgroundColor: '#e0f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0284c7',
          flexShrink: 0,
        }}
      >
        <IconShirt size={15} />
      </div>
    );
  }
  if (code.includes('pant') || code.includes('trouser')) {
    return (
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#334155',
          flexShrink: 0,
        }}
      >
        <IconPants size={15} />
      </div>
    );
  }
  if (code.includes('boot') || code.includes('shoe')) {
    return (
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          backgroundColor: '#f5f5f4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#44403c',
          flexShrink: 0,
        }}
      >
        <IconBoot size={15} />
      </div>
    );
  }
  if (code.includes('torch') || code.includes('light')) {
    return (
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1e293b',
          flexShrink: 0,
        }}
      >
        <IconTorch size={15} />
      </div>
    );
  }
  if (code.includes('mask')) {
    return (
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          backgroundColor: '#e0f7fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00838f',
          flexShrink: 0,
        }}
      >
        <IconMask size={15} />
      </div>
    );
  }
  if (code.includes('baton')) {
    return (
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0f172a',
          flexShrink: 0,
        }}
      >
        <IconBaton size={15} />
      </div>
    );
  }
  if (code.includes('vest')) {
    return (
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          backgroundColor: '#fff7ed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ea580c',
          flexShrink: 0,
        }}
      >
        <IconVest size={15} />
      </div>
    );
  }
  return (
    <div
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '7px',
        backgroundColor: '#f3e8ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#7c3aed',
        flexShrink: 0,
      }}
    >
      <IconPackage size={15} />
    </div>
  );
}

export function SetListView() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [backendSets, setBackendSets] = useState<ItemSet[]>([]);
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Drawer / Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(searchParams.get('new') === 'true');
  const [editingKitId, setEditingKitId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formRole, setFormRole] = useState('Security Guard');
  const [formDepartment, setFormDepartment] = useState('Security Operations');
  const [formItems, setFormItems] = useState<SeedKitItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [setsRes, itemsRes] = await Promise.all([
        scmSetsApi.listSets({ limit: 100 }),
        ScmApiService.listItems({ limit: 100 }),
      ]);
      const rawSets = Array.isArray(setsRes)
        ? setsRes
        : Array.isArray(setsRes?.data)
          ? setsRes.data
          : setsRes?.sets || [];
      setBackendSets(rawSets);
      setCatalogItems(itemsRes.items || []);
    } catch {
      try {
        const fallbackRes = await ScmApiService.listSets({ limit: 100 });
        setBackendSets(fallbackRes.sets || []);
      } catch {
        // Handled
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Combine backend sets with seeds
  const allKits: SeedKit[] = [
    ...backendSets.map((bs, idx) => ({
      id: bs.id,
      code: bs.setCode,
      name: bs.name,
      targetRole: bs.targetRole || 'General Workforce',
      department: bs.targetDepartment || 'Operations',
      description: bs.description || 'Standard workforce equipment bundle.',
      accentColor: (idx % 2 === 0 ? 'purple' : 'blue') as 'purple' | 'blue',
      items: (bs.items || []).map(
        (
          bi: {
            id?: string;
            itemId?: string;
            item?: {
              itemCode?: string;
              name?: string;
              currentStock?: number;
              reorderLevel?: number;
            };
            quantity?: number;
          },
          iIdx: number,
        ) => {
          const catItem = catalogItems.find((c) => c.id === bi.itemId);
          const itemObj = bi.item || catItem;
          return {
            id: bi.id || `bi_${iIdx}`,
            itemId: bi.itemId || '',
            itemCode:
              itemObj?.itemCode || catItem?.itemCode || 'ITEM-' + (bi.itemId || '').slice(0, 5),
            name: itemObj?.name || catItem?.name || 'Bundle Item',
            quantity: bi.quantity ?? 1,
            stock: itemObj?.currentStock ?? catItem?.currentStock ?? 50,
            isLowStock:
              (itemObj?.currentStock ?? catItem?.currentStock ?? 50) <=
              (itemObj?.reorderLevel ?? catItem?.reorderLevel ?? 10),
          };
        },
      ),
    })),
    // If no backend sets exist yet, show default template seeds
    ...(backendSets.length === 0 ? DEFAULT_SEEDS : []),
  ];

  // Filter kits
  const filteredKits = allKits.filter((kit) => {
    if (selectedRole && kit.targetRole !== selectedRole) return false;
    if (selectedDepartment && kit.department !== selectedDepartment) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        kit.name.toLowerCase().includes(q) ||
        kit.code.toLowerCase().includes(q) ||
        kit.targetRole.toLowerCase().includes(q) ||
        kit.department.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenCreateNew = () => {
    setEditingKitId(null);
    setFormName('');
    setFormCode(`SET-${Date.now().toString().slice(-4)}`);
    setFormRole('Security Guard');
    setFormDepartment('Security Operations');
    // Pre-populate with first real item from inventory if available
    const first = catalogItems[0];
    if (first) {
      setFormItems([
        {
          id: `f_${Date.now()}_${first.id}`,
          itemId: first.id,
          itemCode: first.itemCode,
          name: first.name,
          quantity: 1,
          stock: first.currentStock,
          isLowStock: first.currentStock <= first.reorderLevel,
        },
      ]);
    } else {
      setFormItems([]);
    }
    setIsAddItemOpen(catalogItems.length === 0);
    setIsDrawerOpen(true);
  };

  const handleOpenEditKit = (kit: SeedKit) => {
    setEditingKitId(kit.id);
    setFormName(kit.name);
    setFormCode(kit.code);
    setFormRole(kit.targetRole);
    setFormDepartment(kit.department);
    // Map items to match catalog item UUIDs
    setFormItems(
      kit.items.map((it) => {
        const match = catalogItems.find(
          (c) => c.id === it.itemId || c.itemCode === it.itemCode || c.name === it.name,
        );
        return {
          ...it,
          itemId: match ? match.id : it.itemId,
          stock: match ? match.currentStock : it.stock,
          isLowStock: match ? match.currentStock <= match.reorderLevel : it.isLowStock,
        };
      }),
    );
    setIsDrawerOpen(true);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId || item.id === itemId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setFormItems((prev) => prev.filter((i) => i.itemId !== itemId && i.id !== itemId));
  };

  const handleAddCatalogItem = (catItem: Item) => {
    const existing = formItems.find((i) => i.itemId === catItem.id);
    if (existing) {
      handleUpdateQuantity(existing.itemId, 1);
    } else {
      setFormItems((prev) => [
        ...prev,
        {
          id: `f_${Date.now()}_${catItem.id}`,
          itemId: catItem.id,
          itemCode: catItem.itemCode,
          name: catItem.name,
          quantity: 1,
          stock: catItem.currentStock,
          isLowStock: catItem.currentStock <= catItem.reorderLevel,
        },
      ]);
    }
    setIsAddItemOpen(false);
  };

  const handleSaveKit = async () => {
    if (!formName.trim() || !formCode.trim()) {
      showToast('Please enter both Kit Name and Kit Code', 'warning');
      return;
    }
    if (formItems.length === 0) {
      showToast('Please add at least one item from the inventory catalog', 'warning');
      return;
    }

    // Resolve each item to a valid inventory item UUID
    const validItems: { itemId: string; quantity: number }[] = [];
    for (const fi of formItems) {
      const match = catalogItems.find(
        (c) => c.id === fi.itemId || c.itemCode === fi.itemCode || c.name === fi.name,
      );
      const resolvedId = match ? match.id : fi.itemId;

      // If it is an unresolved mock seed ID (e.g. item_1), assign first real catalog item or keep resolved
      const defaultCatalogId = catalogItems[0]?.id;
      if (resolvedId.startsWith('item_') && defaultCatalogId) {
        validItems.push({
          itemId: defaultCatalogId,
          quantity: Math.max(1, Number(fi.quantity) || 1),
        });
      } else {
        validItems.push({
          itemId: resolvedId,
          quantity: Math.max(1, Number(fi.quantity) || 1),
        });
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateSetDto = {
        setCode: formCode.trim().toUpperCase(),
        name: formName.trim(),
        description: `${formName.trim()} bundle for ${formRole} in ${formDepartment}.`,
        targetRole: formRole || undefined,
        targetDepartment: formDepartment || undefined,
        items: validItems,
        isActive: true,
      };

      if (editingKitId && !editingKitId.startsWith('set_seed_')) {
        await scmSetsApi.updateSet(editingKitId, payload);
        showToast(`Kit "${formName}" updated successfully in backend`, 'success');
      } else {
        await scmSetsApi.createSet(payload);
        showToast(`Kit "${formName}" created and published to backend`, 'success');
      }
      setIsDrawerOpen(false);
      await loadData();
    } catch (err: unknown) {
      let errMsg = 'Failed to save kit';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
        errMsg = axiosErr.response?.data?.message || axiosErr.response?.data?.error || errMsg;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        fontFamily: 'var(--font-family-sans)',
        color: '#0f172a',
      }}
    >
      {/* 1. Header Section */}
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
            Standard Sets & Kits
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
            Configure standardized equipment bundles for workforce roles.
          </p>
        </div>
      </div>

      {/* 2. Filter & Action Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.75rem',
            flex: '1 1 500px',
          }}
        >
          {/* Search input */}
          <div
            style={{
              flex: '1 1 240px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
            }}
          >
            <IconSearch size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search sets by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          {/* Role Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                appearance: 'none',
                padding: '0.5rem 2.1rem 0.5rem 0.85rem',
                fontSize: '0.84rem',
                fontWeight: 500,
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
              }}
            >
              <option value="">All Target Roles</option>
              <option value="Security Guard">Security Guard</option>
              <option value="General Workforce">General Workforce</option>
              <option value="Housekeeping Staff">Housekeeping Staff</option>
              <option value="Facility Manager">Facility Manager</option>
              <option value="Driver / Logistics">Driver / Logistics</option>
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

          {/* Department Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              style={{
                appearance: 'none',
                padding: '0.5rem 2.1rem 0.5rem 0.85rem',
                fontSize: '0.84rem',
                fontWeight: 500,
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
              }}
            >
              <option value="">All Departments</option>
              <option value="Security Operations">Security Operations</option>
              <option value="Operations">Operations</option>
              <option value="Facilities">Facilities</option>
              <option value="Logistics">Logistics</option>
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
        </div>

        {/* Configure New Set CTA */}
        <div>
          <button
            type="button"
            onClick={handleOpenCreateNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              fontSize: '0.84rem',
              fontWeight: 600,
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
            <IconPlus size={15} color="#ffffff" />
            <span>Configure New Set</span>
          </button>
        </div>
      </div>

      {/* 3. Main View: Kit Cards Grid (Always full-width, never shifts) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.25rem',
          alignItems: 'stretch',
        }}
      >
        {isLoading && filteredKits.length === 0 ? (
          <div
            style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center', color: '#64748b' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconRotateCcw
                size={16}
                color="#6366f1"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <span>Loading standard sets & kits...</span>
            </div>
          </div>
        ) : (
          filteredKits.map((kit) => {
            const isPurple = kit.accentColor === 'purple';
            const iconBg = isPurple ? '#f3e8ff' : '#fef3c7';
            const iconColor = isPurple ? '#7c3aed' : '#d97706';

            return (
              <div
                key={kit.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #edf2f7',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                  transition: 'box-shadow 150ms ease, transform 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Kit Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: iconColor,
                      flexShrink: 0,
                    }}
                  >
                    <IconPackage size={20} color={iconColor} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                      {kit.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
                      {kit.code}
                    </div>
                  </div>
                </div>

                {/* Role & Dept metadata */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ color: '#64748b', width: '45px' }}>Role</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{kit.targetRole}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ color: '#64748b', width: '45px' }}>Dept.</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{kit.department}</span>
                  </div>
                </div>

                {/* Items in this set */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#475569',
                      marginBottom: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>✦</span>
                    <span>{kit.items.length} Items</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {kit.items.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.81rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {getKitItemIcon(item.itemCode, item.name)}
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {item.itemCode}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '5px',
                            backgroundColor: '#f1f5f9',
                            fontSize: '0.75rem',
                            fontWeight: 650,
                            color: '#334155',
                          }}
                        >
                          ×{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom preview icons + View Details */}
                <div
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '0.75rem',
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {kit.items.slice(0, 4).map((it) => (
                      <div
                        key={it.id}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #edf2f7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconLayers size={12} color="#64748b" />
                      </div>
                    ))}
                    {kit.items.length > 4 && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#5846f6',
                          backgroundColor: '#f5f3ff',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '4px',
                        }}
                      >
                        +{kit.items.length - 4}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEditKit(kit)}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#5846f6',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span>View Details</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Centered Premium Modal Dialog */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '1.25rem',
            animation: 'fadeIn 180ms ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDrawerOpen(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04)',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'scaleUp 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(180deg, #ffffff 0%, #fafcff 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  <IconLayers size={20} />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: '1.12rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {editingKitId ? 'Edit Standard Kit' : 'Configure New Standard Kit'}
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                    Define workforce equipment bundles and manage component item quantities.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '9px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e2e8f0';
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div
              style={{
                padding: '1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {/* Card Section 1: Basic Information */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Kit Specifications
                </div>

                {/* Row 1: Name & Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Kit Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Security Guard Kit"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.84rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        outline: 'none',
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Kit Code <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="e.g. KIT-SEC-001"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.84rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        outline: 'none',
                        color: '#0f172a',
                        backgroundColor: '#ffffff',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: Target Role & Department */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Target Role <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 2rem 0.55rem 0.85rem',
                          fontSize: '0.84rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          outline: 'none',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                          appearance: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Security Guard">Security Guard</option>
                        <option value="General Workforce">General Workforce</option>
                        <option value="Housekeeping Staff">Housekeeping Staff</option>
                        <option value="Facility Manager">Facility Manager</option>
                        <option value="Driver / Logistics">Driver / Logistics</option>
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
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Department <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={formDepartment}
                        onChange={(e) => setFormDepartment(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 2rem 0.55rem 0.85rem',
                          fontSize: '0.84rem',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          outline: 'none',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                          appearance: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Security Operations">Security Operations</option>
                        <option value="Operations">Operations</option>
                        <option value="Facilities">Facilities</option>
                        <option value="Logistics">Logistics</option>
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
                  </div>
                </div>
              </div>

              {/* Card Section 2: Items in this Set */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      Bundle Components
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                      {formItems.length} item{formItems.length !== 1 ? 's' : ''} assigned to this
                      standard set
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddItemOpen(!isAddItemOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 650,
                      borderRadius: '9px',
                      background: isAddItemOpen
                        ? '#f1f5f9'
                        : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: isAddItemOpen ? '#475569' : '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: isAddItemOpen ? 'none' : '0 2px 6px rgba(99, 102, 241, 0.25)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <IconPlus size={14} color={isAddItemOpen ? '#475569' : '#ffffff'} />
                    <span>{isAddItemOpen ? 'Close Picker' : 'Add Item'}</span>
                  </button>
                </div>

                {/* Add Item Dropdown Picker */}
                {isAddItemOpen && (
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      animation: 'fadeIn 120ms ease-out',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 650, color: '#475569' }}>
                      Select an item from the catalog to attach:
                    </div>
                    <div
                      style={{
                        maxHeight: '160px',
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: '0.45rem',
                      }}
                    >
                      {catalogItems.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleAddCatalogItem(cat)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            textAlign: 'left',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 120ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#6366f1';
                            e.currentTarget.style.backgroundColor = '#faf5ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{cat.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {cat.itemCode}
                            </div>
                          </div>
                          <span
                            style={{
                              color: cat.currentStock <= cat.reorderLevel ? '#d97706' : '#16a34a',
                              fontSize: '0.72rem',
                              fontWeight: 650,
                              backgroundColor:
                                cat.currentStock <= cat.reorderLevel ? '#fef3c7' : '#dcfce7',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                            }}
                          >
                            {cat.currentStock} in stock
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {formItems.length === 0 ? (
                    <div
                      style={{
                        padding: '1.5rem',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: '0.82rem',
                        border: '1px dashed #e2e8f0',
                        borderRadius: '10px',
                      }}
                    >
                      No items attached to this set yet. Click &ldquo;Add Item&rdquo; above.
                    </div>
                  ) : (
                    formItems.map((it) => (
                      <div
                        key={it.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #f1f5f9',
                          backgroundColor: '#f8fafc',
                          transition: 'all 120ms ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {getKitItemIcon(it.itemCode, it.name)}
                          <div>
                            <div style={{ fontWeight: 650, fontSize: '0.84rem', color: '#0f172a' }}>
                              {it.name}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginTop: '0.1rem',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#64748b',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {it.itemCode}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  color: it.isLowStock ? '#d97706' : '#16a34a',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                }}
                              >
                                <span>●</span>
                                <span>{it.stock} in stock</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {/* Quantity Stepper */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '8px',
                              border: '1.5px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              overflow: 'hidden',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(it.itemId, -1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                border: 'none',
                                backgroundColor: '#ffffff',
                                color: '#475569',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 100ms ease',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f1f5f9')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = '#ffffff')
                              }
                            >
                              −
                            </button>
                            <span
                              style={{
                                width: '28px',
                                textAlign: 'center',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                color: '#0f172a',
                              }}
                            >
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(it.itemId, 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                border: 'none',
                                backgroundColor: '#ffffff',
                                color: '#475569',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 100ms ease',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f1f5f9')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = '#ffffff')
                              }
                            >
                              +
                            </button>
                          </div>

                          {/* Delete from Kit Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.itemId)}
                            style={{
                              border: 'none',
                              backgroundColor: '#fee2e2',
                              color: '#ef4444',
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 120ms ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fecaca';
                              e.currentTarget.style.color = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                          >
                            <IconX size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1.1rem 1.5rem',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#fafcff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.85rem',
              }}
            >
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
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
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveKit}
                style={{
                  padding: '0.55rem 1.45rem',
                  fontSize: '0.84rem',
                  fontWeight: 650,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.45)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <IconRotateCcw
                      size={14}
                      color="#ffffff"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    <span>Saving Kit...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save & Publish Kit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
