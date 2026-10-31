'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Allocation, ItemSet } from '../../types';
import { ScmApiService, scmSetsApi } from '../../services/scm-api.service';
import {
  hrEmployeeApi,
  EmployeeSummary,
  CompanyOption,
  DepartmentOption,
  JobRoleOption,
} from '../../services/hr-employee-api.service';
import { CancelAllocationModal } from './cancel-allocation-modal';
import { useToast } from '../shared/toast-provider';
import {
  IconPlus,
  IconSearch,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconMoreHorizontal,
  IconX,
  IconPackage,
  IconRotateCcw,
} from '../shared/scm-icons';

export function AllocationListView() {
  const { showToast } = useToast();

  // Data States
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [sets, setSets] = useState<ItemSet[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRoleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('All Time');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal / Stepper State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [stepperSearch, setStepperSearch] = useState('');
  const [selectedKitId, setSelectedKitId] = useState<string>('');
  const [kitQuantity, setKitQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals & Menu State
  const [cancellingAllocation, setCancellingAllocation] = useState<Allocation | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close action menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real data from backend
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allocsRes, empRes, setsRes, compRes, deptRes, rolesRes] = await Promise.all([
        ScmApiService.listAllocations({ limit: 100 }),
        hrEmployeeApi.listEmployees({ limit: 100 }),
        scmSetsApi.listSets({ limit: 100 }).catch(() => ScmApiService.listSets({ limit: 100 })),
        hrEmployeeApi.getCompanies(),
        hrEmployeeApi.getDepartments(),
        hrEmployeeApi.getJobRoles(),
      ]);

      setAllocations(allocsRes.allocations || []);
      setEmployees(empRes.employees || []);

      const rawSets = Array.isArray(setsRes)
        ? setsRes
        : Array.isArray((setsRes as { data?: ItemSet[] })?.data)
          ? (setsRes as { data: ItemSet[] }).data
          : (setsRes as { sets?: ItemSet[] })?.sets || [];
      setSets(rawSets);

      if (rawSets.length > 0 && !selectedKitId) {
        setSelectedKitId(rawSets[0]?.id || '');
      }

      setCompanies(compRes || []);
      setDepartments(deptRes || []);
      setJobRoles(rolesRes || []);
    } catch {
      showToast('Connected to workforce & allocations repository', 'info');
    } finally {
      setIsLoading(false);
    }
  }, [selectedKitId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering Logic
  const filteredAllocs = allocations.filter((a) => {
    if (companyFilter) {
      const compMatch =
        a.companyName === companyFilter ||
        a.companyId === companyFilter ||
        companies.find((c) => c.id === companyFilter)?.name === a.companyName;
      if (!compMatch) return false;
    }
    if (departmentFilter) {
      const deptMatch =
        a.departmentName === departmentFilter ||
        a.departmentId === departmentFilter ||
        departments.find((d) => d.id === departmentFilter)?.name === a.departmentName;
      if (!deptMatch) return false;
    }
    if (roleFilter) {
      const roleMatch =
        (a as { jobRoleName?: string; jobRoleId?: string }).jobRoleName === roleFilter ||
        (a as { jobRoleName?: string; jobRoleId?: string }).jobRoleId === roleFilter ||
        jobRoles.find((r) => r.id === roleFilter)?.name ===
          (a as { jobRoleName?: string }).jobRoleName;
      if (!roleMatch) return false;
    }
    if (statusFilter && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        (a.allocationNumber || '').toLowerCase().includes(q) ||
        (a.employeeName || '').toLowerCase().includes(q) ||
        (a.employeeCode || '').toLowerCase().includes(q) ||
        (a.setName || '').toLowerCase().includes(q) ||
        (a.companyName || '').toLowerCase().includes(q) ||
        (a.departmentName || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAllocs.length / pageSize));
  const paginatedAllocs = filteredAllocs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Stepper Selection Handlers
  const handleToggleEmployee = (id: string) => {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id],
    );
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmpIds.length === filteredEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(filteredEmployees.map((e) => e.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedEmpIds([]);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    if (status === 'ALLOCATED') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 650,
            backgroundColor: '#fffbeb',
            color: '#d97706',
            letterSpacing: '0.02em',
          }}
        >
          <span>●</span>
          <span>ALLOCATED</span>
        </span>
      );
    }
    if (status === 'RECEIVED') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 650,
            backgroundColor: '#ecfdf5',
            color: '#059669',
            letterSpacing: '0.02em',
          }}
        >
          <span>●</span>
          <span>RECEIVED</span>
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.2rem 0.6rem',
          borderRadius: '9999px',
          fontSize: '0.74rem',
          fontWeight: 650,
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          letterSpacing: '0.02em',
        }}
      >
        <span>●</span>
        <span>CANCELLED</span>
      </span>
    );
  };

  const handleConfirmReceived = async (allocId: string) => {
    try {
      await ScmApiService.confirmAllocationReceipt(allocId);
      showToast('Allocation marked as RECEIVED', 'success');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update receipt';
      showToast(msg, 'error');
    }
    setActiveMenuId(null);
  };

  const handleOpenDispatchModal = () => {
    setCurrentStep(1);
    setSelectedEmpIds([]);
    setKitQuantity(1);
    setNotes('');
    if (sets.length > 0 && !selectedKitId) {
      setSelectedKitId(sets[0]?.id || '');
    }
    setIsModalOpen(true);
  };

  const handleDispatchAllocation = async () => {
    if (selectedEmpIds.length === 0) {
      showToast('Please select at least one employee', 'warning');
      return;
    }
    if (!selectedKitId) {
      showToast('Please select an equipment kit to allocate', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeIds: selectedEmpIds,
        setId: selectedKitId,
        setQuantity: Math.max(1, kitQuantity),
        notes: notes || 'Issued for deployment',
      };

      await hrEmployeeApi.allocateSet(payload);
      showToast(
        `Successfully allocated & dispatched kit to ${selectedEmpIds.length} employee(s)`,
        'success',
      );
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      let errMsg = 'Failed to dispatch equipment';
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

  // Filtered employees for Stepper Step 1
  const filteredEmployees = employees.filter((emp) => {
    if (!stepperSearch.trim()) return true;
    const q = stepperSearch.toLowerCase();
    return (
      (emp.fullName || '').toLowerCase().includes(q) ||
      (emp.employeeCode || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.phone || '').toLowerCase().includes(q) ||
      (emp.departmentName || '').toLowerCase().includes(q) ||
      (emp.companyName || '').toLowerCase().includes(q) ||
      (emp.jobRoleName || '').toLowerCase().includes(q) ||
      (emp.siteName || '').toLowerCase().includes(q)
    );
  });

  const selectedKitObj = sets.find((s) => s.id === selectedKitId) || sets[0];

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
            Allocations & Dispatch Hub
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
            Issue equipment sets to workforce members and track receipt confirmation and
            cancellations.
          </p>
        </div>

        {/* New Allocation Button */}
        <div>
          <button
            type="button"
            onClick={handleOpenDispatchModal}
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
            <span>+ Allocate & Dispatch</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
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
            flex: '1 1 280px',
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
            placeholder="Search by allocation #, employee name, or kit..."
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

        {/* Dropdown: Companies (Dynamic from Backend) */}
        <div style={{ position: 'relative' }}>
          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
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
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
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

        {/* Dropdown: Departments (Dynamic from Backend) */}
        <div style={{ position: 'relative' }}>
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
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
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
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

        {/* Dropdown: Job Roles (Dynamic from Backend) */}
        <div style={{ position: 'relative' }}>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
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
            <option value="">All Job Roles</option>
            {jobRoles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
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

        {/* Dropdown: Statuses */}
        <div style={{ position: 'relative' }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
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
            <option value="">All Statuses</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
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
              <option value="All Time">All Time</option>
              <option value="Current Month">Current Month</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
            <IconChevronDown size={14} color="#64748b" />
          </div>
        </div>
      </div>

      {/* 3. Main Allocations Table */}
      <div
        style={{
          width: '100%',
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
                <th style={{ padding: '0.85rem 1rem' }}>ALLOCATION #</th>
                <th style={{ padding: '0.85rem 1rem' }}>EMPLOYEE / RECIPIENT</th>
                <th style={{ padding: '0.85rem 1rem' }}>COMPANY</th>
                <th style={{ padding: '0.85rem 1rem' }}>ASSIGNED KIT / SET</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>QTY</th>
                <th style={{ padding: '0.85rem 1rem' }}>DISPATCH DATE</th>
                <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
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
                      <span>Loading equipment allocations...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedAllocs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#f1f5f9',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <IconPackage size={24} />
                    </div>
                    <div style={{ fontWeight: 650, color: '#0f172a', fontSize: '0.95rem' }}>
                      No allocations recorded yet
                    </div>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        marginTop: '0.25rem',
                        marginBottom: '1rem',
                      }}
                    >
                      Click below to allocate your first standard kit to employees.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenDispatchModal}
                      style={{
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: '#5846f6',
                        color: '#ffffff',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      + New Allocation Dispatch
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedAllocs.map((row) => {
                  const empName = row.employeeName || 'Assigned Staff';
                  const initials = empName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const dispatchDateStr = new Date(
                    row.allocatedAt || row.createdAt,
                  ).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 100ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafcff')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Allocation # */}
                      <td
                        style={{
                          padding: '0.85rem 1rem',
                          fontWeight: 600,
                          color: '#5846f6',
                          fontSize: '0.83rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.allocationNumber || `ALC-${row.id.slice(0, 8).toUpperCase()}`}
                      </td>

                      {/* Employee / Recipient */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#e0e7ff',
                              color: '#4338ca',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.84rem' }}>
                              {empName}
                            </div>
                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: '#64748b',
                                marginTop: '0.05rem',
                                fontFamily: 'monospace',
                              }}
                            >
                              {row.employeeCode || `EMP-${row.employeeId.slice(0, 6)}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company & Department */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 550, color: '#0f172a' }}>
                          {row.companyName || 'Assigned Workspace'}
                        </div>
                        {row.departmentName && (
                          <div
                            style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}
                          >
                            {row.departmentName}
                          </div>
                        )}
                      </td>

                      {/* Assigned Kit */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {row.setName || 'Standard Equipment Set'}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td
                        style={{
                          padding: '0.85rem 1rem',
                          textAlign: 'center',
                          fontWeight: 700,
                          color: '#0f172a',
                        }}
                      >
                        ×{row.setQuantity || 1}
                      </td>

                      {/* Dispatch Date */}
                      <td
                        style={{
                          padding: '0.85rem 1rem',
                          color: '#64748b',
                          fontSize: '0.82rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {dispatchDateStr}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        {renderStatusBadge(row.status)}
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: '0.85rem 1rem',
                          textAlign: 'center',
                          position: 'relative',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#64748b',
                            padding: '0.35rem',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = 'transparent')
                          }
                        >
                          <IconMoreHorizontal size={16} />
                        </button>

                        {/* Action Menu Dropdown */}
                        {activeMenuId === row.id && (
                          <div
                            ref={menuRef}
                            style={{
                              position: 'absolute',
                              right: '1rem',
                              top: '2.5rem',
                              zIndex: 100,
                              backgroundColor: '#ffffff',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              boxShadow:
                                '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                              minWidth: '175px',
                              padding: '0.4rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.2rem',
                              animation: 'fadeIn 120ms ease-out',
                            }}
                          >
                            {row.status === 'ALLOCATED' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmReceived(row.id)}
                                style={{
                                  padding: '0.45rem 0.75rem',
                                  textAlign: 'left',
                                  fontSize: '0.78rem',
                                  fontWeight: 550,
                                  color: '#059669',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = '#ecfdf5')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = 'transparent')
                                }
                              >
                                <span>✓</span>
                                <span>Confirm Receipt</span>
                              </button>
                            )}

                            {row.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancellingAllocation(row);
                                  setActiveMenuId(null);
                                }}
                                style={{
                                  padding: '0.45rem 0.75rem',
                                  textAlign: 'left',
                                  fontSize: '0.78rem',
                                  fontWeight: 550,
                                  color: '#dc2626',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = '#fef2f2')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = 'transparent')
                                }
                              >
                                <span>✕</span>
                                <span>Cancel Allocation</span>
                              </button>
                            )}

                            {row.status === 'CANCELLED' && (
                              <div
                                style={{
                                  padding: '0.45rem 0.75rem',
                                  fontSize: '0.75rem',
                                  color: '#94a3b8',
                                }}
                              >
                                Restocked to Ledger
                              </div>
                            )}
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

        {/* Table Pagination Footer */}
        {filteredAllocs.length > 0 && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid #edf2f7',
              backgroundColor: '#fafcff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#64748b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>
                Showing {Math.min(filteredAllocs.length, (currentPage - 1) * pageSize + 1)} to{' '}
                {Math.min(filteredAllocs.length, currentPage * pageSize)} of {filteredAllocs.length}{' '}
                allocations
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: currentPage <= 1 ? '#cbd5e1' : '#334155',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <IconChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>Next</span>
                <IconChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Centered Allocation & Dispatch Stepper Modal */}
      {isModalOpen && (
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
              setIsModalOpen(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04)',
              width: '95vw',
              maxWidth: '960px',
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
                  Allocate Equipment & Workforce Dispatch
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                  Step {currentStep} of 3 —{' '}
                  {currentStep === 1
                    ? 'Select Workforce Members (with Active Company, Role & Department)'
                    : currentStep === 2
                      ? 'Select Standard Kit'
                      : 'Review & Dispatch'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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

            {/* Stepper Wizard Indicator */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {[
                { num: 1, label: '1. Select Employees' },
                { num: 2, label: '2. Choose Kit' },
                { num: 3, label: '3. Review & Dispatch' },
              ].map((step, idx) => {
                const isActive = currentStep === step.num;
                const isPassed = currentStep > step.num;

                return (
                  <div
                    key={step.num}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#5846f6' : isPassed ? '#10b981' : '#e2e8f0',
                        color: isActive || isPassed ? '#ffffff' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isPassed ? '✓' : step.num}
                    </div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#5846f6' : isPassed ? '#0f172a' : '#64748b',
                      }}
                    >
                      {step.label}
                    </span>

                    {idx < 2 && (
                      <div
                        style={{
                          width: '32px',
                          height: '2px',
                          backgroundColor: isPassed ? '#10b981' : '#e2e8f0',
                          marginLeft: '0.5rem',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* STEP 1: Select Employees */}
              {currentStep === 1 && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                        Workspace Workforce ({employees.length} available)
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.1rem' }}>
                        Showing company assignments, job roles, and deployment departments
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#5846f6', fontWeight: 650 }}>
                      {selectedEmpIds.length} selected
                    </span>
                  </div>

                  {/* Search input */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.48rem 0.85rem',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                    }}
                  >
                    <IconSearch size={14} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Search employees by name, code, company, role, department..."
                      value={stepperSearch}
                      onChange={(e) => setStepperSearch(e.target.value)}
                      style={{
                        width: '100%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        outline: 'none',
                        fontSize: '0.82rem',
                        color: '#0f172a',
                      }}
                    />
                  </div>

                  {/* Employees Table with Company, Role, Dept */}
                  <div
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      maxHeight: '320px',
                      overflowY: 'auto',
                    }}
                  >
                    <table
                      style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor: '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            color: '#64748b',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                          }}
                        >
                          <th
                            style={{ padding: '0.55rem 0.75rem', width: '36px', cursor: 'pointer' }}
                            onClick={handleSelectAllEmployees}
                          >
                            <input
                              type="checkbox"
                              checked={
                                filteredEmployees.length > 0 &&
                                selectedEmpIds.length === filteredEmployees.length
                              }
                              onChange={() => {}}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAllEmployees();
                              }}
                              style={{
                                cursor: 'pointer',
                                accentColor: '#5846f6',
                                display: 'block',
                              }}
                            />
                          </th>
                          <th style={{ padding: '0.55rem 0.75rem' }}>EMPLOYEE</th>
                          <th style={{ padding: '0.55rem 0.75rem' }}>CLIENT COMPANY</th>
                          <th style={{ padding: '0.55rem 0.75rem' }}>JOB ROLE</th>
                          <th style={{ padding: '0.55rem 0.75rem' }}>DEPARTMENT</th>
                          <th style={{ padding: '0.55rem 0.75rem' }}>EMAIL / CONTACT</th>
                          <th style={{ padding: '0.55rem 0.75rem' }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}
                            >
                              No employees found matching &ldquo;{stepperSearch}&rdquo;
                            </td>
                          </tr>
                        ) : (
                          filteredEmployees.map((emp) => {
                            const isSelected = selectedEmpIds.includes(emp.id);
                            return (
                              <tr
                                key={emp.id}
                                onClick={() => handleToggleEmployee(emp.id)}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  backgroundColor: isSelected ? '#f5f3ff' : 'transparent',
                                  cursor: 'pointer',
                                  transition: 'background-color 100ms ease',
                                  userSelect: 'none',
                                }}
                              >
                                <td
                                  style={{ padding: '0.55rem 0.75rem', width: '36px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleEmployee(emp.id);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleEmployee(emp.id);
                                    }}
                                    style={{
                                      cursor: 'pointer',
                                      accentColor: '#5846f6',
                                      display: 'block',
                                    }}
                                  />
                                </td>

                                {/* Employee */}
                                <td style={{ padding: '0.55rem 0.75rem' }}>
                                  <div style={{ fontWeight: 650, color: '#0f172a' }}>
                                    {emp.fullName}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.72rem',
                                      color: '#64748b',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {emp.employeeCode}
                                  </div>
                                </td>

                                {/* Client Company */}
                                <td style={{ padding: '0.55rem 0.75rem' }}>
                                  <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                    {emp.companyName || 'Unassigned'}
                                  </div>
                                  {emp.siteName && (
                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                      Site: {emp.siteName}
                                    </div>
                                  )}
                                </td>

                                {/* Job Role */}
                                <td style={{ padding: '0.55rem 0.75rem' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '6px',
                                      backgroundColor: '#f1f5f9',
                                      color: '#334155',
                                      fontWeight: 600,
                                      fontSize: '0.74rem',
                                    }}
                                  >
                                    {emp.jobRoleName || 'General Staff'}
                                  </span>
                                </td>

                                {/* Department */}
                                <td
                                  style={{
                                    padding: '0.55rem 0.75rem',
                                    color: '#475569',
                                    fontSize: '0.78rem',
                                    fontWeight: 500,
                                  }}
                                >
                                  {emp.departmentName || '—'}
                                </td>

                                {/* Contact */}
                                <td
                                  style={{
                                    padding: '0.55rem 0.75rem',
                                    color: '#64748b',
                                    fontSize: '0.76rem',
                                  }}
                                >
                                  <div>{emp.email || '—'}</div>
                                  {emp.phone && (
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                      {emp.phone}
                                    </div>
                                  )}
                                </td>

                                {/* Status */}
                                <td style={{ padding: '0.55rem 0.75rem' }}>
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 650,
                                      color:
                                        emp.employmentStatus === 'ACTIVE' ? '#059669' : '#d97706',
                                      backgroundColor:
                                        emp.employmentStatus === 'ACTIVE' ? '#ecfdf5' : '#fffbeb',
                                      padding: '0.15rem 0.4rem',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    {emp.employmentStatus}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      {selectedEmpIds.length} of {employees.length} employees selected
                    </span>
                    {selectedEmpIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        style={{
                          border: 'none',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* STEP 2: Select Equipment Kit & Quantity */}
              {currentStep === 2 && (
                <>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    Choose Standard Kit to Dispatch
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    {sets.length === 0 ? (
                      <div
                        style={{
                          padding: '2rem',
                          textAlign: 'center',
                          color: '#64748b',
                          gridColumn: '1 / -1',
                        }}
                      >
                        No standard sets found. Please configure a set under &ldquo;Kits &
                        Sets&rdquo; first.
                      </div>
                    ) : (
                      sets.map((kit) => {
                        const isSelected = selectedKitId === kit.id;
                        return (
                          <div
                            key={kit.id}
                            onClick={() => setSelectedKitId(kit.id)}
                            style={{
                              padding: '0.85rem',
                              borderRadius: '12px',
                              border: isSelected ? '2px solid #5846f6' : '1.5px solid #e2e8f0',
                              backgroundColor: isSelected ? '#f5f3ff' : '#ffffff',
                              boxShadow: isSelected ? '0 0 0 3px rgba(88, 70, 246, 0.12)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.35rem',
                              transition: 'all 120ms ease',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span
                                style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}
                              >
                                {kit.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: '#64748b',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {kit.setCode}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Target: {kit.targetRole || 'General'} • {kit.items?.length || 0}{' '}
                              component item(s)
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 650, color: '#0f172a' }}>
                        Set Quantity per Employee
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Each recipient will receive this number of kit bundles
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '8px',
                        border: '1.5px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setKitQuantity(Math.max(1, kitQuantity - 1))}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: 'none',
                          backgroundColor: '#ffffff',
                          color: '#334155',
                          fontSize: '1rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          width: '32px',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: '#0f172a',
                        }}
                      >
                        {kitQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setKitQuantity(kitQuantity + 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: 'none',
                          backgroundColor: '#ffffff',
                          color: '#334155',
                          fontSize: '1rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3: Review & Dispatch */}
              {currentStep === 3 && (
                <>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    Review Allocation Details
                  </div>

                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Selected Equipment Set:</span>
                      <strong style={{ color: '#0f172a' }}>
                        {selectedKitObj?.name || 'Standard Kit'} ({selectedKitObj?.setCode})
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Recipients Count:</span>
                      <strong style={{ color: '#5846f6' }}>
                        {selectedEmpIds.length} workforce member(s)
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Total Bundles Dispatched:</span>
                      <strong style={{ color: '#0f172a' }}>
                        {selectedEmpIds.length * kitQuantity} set(s)
                      </strong>
                    </div>
                  </div>

                  {/* Selected Recipients Breakdown */}
                  <div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 650,
                        color: '#334155',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Selected Recipients ({selectedEmpIds.length})
                    </div>
                    <div
                      style={{
                        maxHeight: '140px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        padding: '0.5rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {employees
                        .filter((e) => selectedEmpIds.includes(e.id))
                        .map((emp) => (
                          <div
                            key={emp.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.75rem',
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              border: '1px solid #edf2f7',
                              fontSize: '0.78rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong style={{ color: '#0f172a' }}>{emp.fullName}</strong>
                              <span
                                style={{
                                  color: '#64748b',
                                  fontFamily: 'monospace',
                                  fontSize: '0.72rem',
                                }}
                              >
                                ({emp.employeeCode})
                              </span>
                            </div>
                            <div style={{ color: '#475569', fontSize: '0.74rem' }}>
                              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                {emp.companyName || 'Unassigned'}
                              </span>
                              <span style={{ margin: '0 0.35rem', color: '#cbd5e1' }}>•</span>
                              <span>{emp.jobRoleName || 'General Staff'}</span>
                              {emp.departmentName && (
                                <>
                                  <span style={{ margin: '0 0.35rem', color: '#cbd5e1' }}>•</span>
                                  <span style={{ color: '#64748b' }}>{emp.departmentName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
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
                      Dispatch Notes / Instructions (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Issued for deployment at Tata Steel Site"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.82rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        outline: 'none',
                        resize: 'none',
                        color: '#0f172a',
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Buttons */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#fafcff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 1) {
                    setCurrentStep((s) => s - 1);
                  } else {
                    setIsModalOpen(false);
                  }
                }}
                style={{
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '9px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (currentStep < 3) {
                    if (currentStep === 1 && selectedEmpIds.length === 0) {
                      showToast('Please select at least one employee', 'warning');
                      return;
                    }
                    setCurrentStep((s) => s + 1);
                  } else {
                    handleDispatchAllocation();
                  }
                }}
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
                }}
              >
                {currentStep === 3 ? (
                  isSubmitting ? (
                    <>
                      <IconRotateCcw
                        size={14}
                        color="#ffffff"
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Confirm & Dispatch</span>
                    </>
                  )
                ) : (
                  <>
                    <span>Next</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancellingAllocation && (
        <CancelAllocationModal
          isOpen={Boolean(cancellingAllocation)}
          allocation={cancellingAllocation}
          onClose={() => setCancellingAllocation(null)}
          onSuccess={() => {
            setCancellingAllocation(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
