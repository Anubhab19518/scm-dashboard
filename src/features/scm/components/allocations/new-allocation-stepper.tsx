'use client';

import React, { useState, useEffect } from 'react';
import { ItemSet, Item, EmployeeLookup } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { createAllocationSchema } from '../../schemas/scm.schemas';
import { useToast } from '../shared/toast-provider';

interface NewAllocationStepperProps {
  isOpen: boolean;
  preselectedSetId?: string | null;
  initialSetId?: string | null;
  sets?: ItemSet[];
  items?: Item[];
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { step: 1, title: 'Employees' },
  { step: 2, title: 'Kit / Set' },
  { step: 3, title: 'Stock Availability' },
  { step: 4, title: 'Review & Dispatch' },
];

export function NewAllocationStepper({
  isOpen,
  preselectedSetId,
  initialSetId,
  sets: initialSets,
  items: initialItems,
  onClose,
  onSuccess,
}: NewAllocationStepperProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const [employees, setEmployees] = useState<EmployeeLookup[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [sets, setSets] = useState<ItemSet[]>(initialSets || []);
  const [items, setItems] = useState<Item[]>(initialItems || []);

  // Stepper State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [setQuantity, setSetQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');

  const targetSetId = preselectedSetId || initialSetId;

  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(1);
    setSelectedEmployeeIds([]);
    setSetQuantity(1);
    setNotes('');

    ScmApiService.listEmployees()
      .then((data) => setEmployees(data))
      .catch(() => {});

    if (initialSets && initialSets.length > 0) {
      setSets(initialSets);
      if (targetSetId) {
        setSelectedSetId(targetSetId);
      } else if (initialSets[0]) {
        setSelectedSetId(initialSets[0].id);
      }
    } else {
      ScmApiService.listSets({ limit: 100 })
        .then((res) => {
          setSets(res.sets);
          if (targetSetId) {
            setSelectedSetId(targetSetId);
          } else if (res.sets[0]) {
            setSelectedSetId(res.sets[0].id);
          }
        })
        .catch(() => {});
    }

    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
    } else {
      ScmApiService.listItems({ limit: 100 })
        .then((res) => setItems(res.items))
        .catch(() => {});
    }
  }, [isOpen, targetSetId, initialSets, initialItems]);

  if (!isOpen) return null;

  const activeSet = sets.find((s) => s.id === selectedSetId);

  // Toggle Employee
  const handleToggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployeeIds.length === filteredEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployees.map((e) => e.id));
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (e.departmentName && e.departmentName.toLowerCase().includes(employeeSearch.toLowerCase())),
  );

  // Calculate stock requirement
  const totalEmployeesCount = selectedEmployeeIds.length;
  const stockCalculations = (activeSet?.items || []).map((it) => {
    const catalogItem = items.find((i) => i.id === it.itemId) || it.item;
    const requiredPerEmployee = it.quantity * setQuantity;
    const totalRequired = requiredPerEmployee * (totalEmployeesCount || 1);
    const available = catalogItem?.currentStock ?? 0;
    const isSufficient = available >= totalRequired;

    return {
      itemId: it.itemId,
      name: catalogItem?.name || it.itemId,
      code: catalogItem?.itemCode || '',
      unit: catalogItem?.unit || 'PCS',
      requiredPerEmployee,
      totalRequired,
      available,
      isSufficient,
    };
  });

  const hasInsufficientStock = stockCalculations.some((c) => !c.isSufficient);

  // Step Validation
  const handleNext = () => {
    if (currentStep === 1) {
      if (selectedEmployeeIds.length === 0) {
        showToast('Please select at least one employee recipient', 'warning');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedSetId) {
        showToast('Please select a Kit/Set bundle to allocate', 'warning');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (hasInsufficientStock) {
        showToast(
          'Warning: One or more items have insufficient stock balance. Proceeding may result in negative stock.',
          'warning',
        );
      }
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDispatch = async () => {
    setIsSubmitting(true);
    try {
      const payload = createAllocationSchema.parse({
        employeeIds: selectedEmployeeIds,
        setId: selectedSetId,
        setQuantity: Number(setQuantity),
        notes: notes.trim() || undefined,
      });

      await ScmApiService.createAllocation(payload);
      showToast(
        `Successfully dispatched ${selectedEmployeeIds.length} allocation(s) for ${activeSet?.name || 'Kit'}`,
        'success',
      );
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Dispatch failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9995,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'hsl(var(--bg-overlay))',
        backdropFilter: 'blur(8px)',
        padding: '1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'hsl(var(--bg-secondary))',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid hsl(var(--border-subtle))',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Workforce Equipment Allocation Dispatch
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem', margin: 0 }}>
              Multi-employee equipment distribution with automated atomic stock deduction.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: 'hsl(var(--text-muted))', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'hsl(var(--bg-surface) / 0.5)',
            borderBottom: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <React.Fragment key={s.step}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: isCompleted
                        ? 'hsl(var(--color-success))'
                        : isCurrent
                          ? 'hsl(var(--color-brand-accent))'
                          : 'hsl(var(--bg-secondary))',
                      color: isCompleted || isCurrent ? '#ffffff' : 'hsl(var(--text-muted))',
                      border: isCurrent
                        ? '2px solid hsl(var(--color-brand-accent))'
                        : '1px solid hsl(var(--border-subtle))',
                    }}
                  >
                    {isCompleted ? '✓' : s.step}
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent
                        ? 'hsl(var(--color-brand-accent))'
                        : 'hsl(var(--text-secondary))',
                    }}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor:
                        currentStep > idx + 1
                          ? 'hsl(var(--color-brand-accent))'
                          : 'hsl(var(--border-subtle))',
                      margin: '0 0.75rem',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Stepper Content */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* STEP 1: Select Employees */}
          {currentStep === 1 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Select Workforce Recipients ({selectedEmployeeIds.length} selected)
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllEmployees}
                  style={{
                    fontSize: '0.75rem',
                    color: 'hsl(var(--color-brand-accent))',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {selectedEmployeeIds.length === filteredEmployees.length
                    ? 'Deselect All'
                    : 'Select All Filtered'}
                </button>
              </div>

              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Search workforce by employee name, code, or department..."
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.825rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                  border: '1px solid hsl(var(--border-subtle))',
                  color: 'hsl(var(--text-primary))',
                  marginBottom: '0.75rem',
                }}
              />

              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  border: '1px solid hsl(var(--border-subtle))',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'hsl(var(--bg-surface) / 0.3)',
                }}
              >
                {filteredEmployees.map((emp) => {
                  const isChecked = selectedEmployeeIds.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleToggleEmployee(emp.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderBottom: '1px solid hsl(var(--border-subtle))',
                        backgroundColor: isChecked
                          ? 'hsl(var(--color-brand-accent) / 0.12)'
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: 'hsl(var(--text-primary))',
                            }}
                          >
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                            Code:{' '}
                            <strong style={{ color: 'hsl(var(--text-secondary))' }}>
                              {emp.employeeCode}
                            </strong>{' '}
                            | {emp.departmentName || 'General'}
                          </div>
                        </div>
                      </div>

                      {emp.designation && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'hsl(var(--bg-secondary))',
                            color: 'hsl(var(--text-secondary))',
                            border: '1px solid hsl(var(--border-subtle))',
                          }}
                        >
                          {emp.designation}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Kit / Set Selection */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'hsl(var(--text-secondary))',
                    marginBottom: '0.35rem',
                  }}
                >
                  Select Kit / Standard Set *
                </label>
                <select
                  value={selectedSetId}
                  onChange={(e) => setSelectedSetId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                    border: '1px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  {sets.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.setCode}] {s.name} ({s.items?.length || 0} items)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'hsl(var(--text-secondary))',
                    marginBottom: '0.35rem',
                  }}
                >
                  Quantity of Sets per Employee *
                </label>
                <input
                  type="number"
                  min="1"
                  value={setQuantity}
                  onChange={(e) => setSetQuantity(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                    border: '1px solid hsl(var(--border-subtle))',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                />
              </div>

              {activeSet && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'hsl(var(--bg-surface) / 0.4)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(var(--border-subtle))',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Bundle Contents for {activeSet.name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {activeSet.items?.map((it, idx) => {
                      const catalogItem = items.find((ci) => ci.id === it.itemId) || it.item;
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            color: 'hsl(var(--text-primary))',
                          }}
                        >
                          <span>• {catalogItem?.name || it.itemId}</span>
                          <span
                            style={{ fontWeight: 700, color: 'hsl(var(--color-brand-accent))' }}
                          >
                            x{it.quantity * setQuantity} {catalogItem?.unit || 'units'} / person
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Stock Availability Check */}
          {currentStep === 3 && (
            <div>
              <div style={{ marginBottom: '0.75rem' }}>
                <h3
                  style={{ fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}
                >
                  Real-Time Stock Availability Verification
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                  Verifying total required units across {selectedEmployeeIds.length} employee
                  recipients.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {stockCalculations.map((c) => (
                  <div
                    key={c.itemId}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'hsl(var(--bg-surface) / 0.4)',
                      borderRadius: 'var(--radius-sm)',
                      border: c.isSufficient
                        ? '1px solid hsl(var(--color-success) / 0.3)'
                        : '1px solid hsl(var(--color-danger) / 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-family-mono)',
                            color: 'hsl(var(--color-brand-accent))',
                            fontWeight: 700,
                          }}
                        >
                          {c.code || 'ITEM'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'hsl(var(--text-primary))',
                          }}
                        >
                          {c.name}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'hsl(var(--text-muted))',
                          marginTop: '0.15rem',
                        }}
                      >
                        Need:{' '}
                        <strong style={{ color: 'hsl(var(--text-primary))' }}>
                          {c.totalRequired} {c.unit}
                        </strong>{' '}
                        ({c.requiredPerEmployee} {c.unit} × {selectedEmployeeIds.length} emp)
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: c.isSufficient
                            ? 'hsl(var(--color-success))'
                            : 'hsl(var(--color-danger))',
                        }}
                      >
                        {c.isSufficient ? '✓ In Stock' : '⚠️ Shortage'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))' }}>
                        Available: {c.available} {c.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {hasInsufficientStock && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: 'hsl(var(--color-warning-bg))',
                    border: '1px solid hsl(var(--color-warning) / 0.4)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'hsl(var(--color-warning))',
                  }}
                >
                  <strong>Notice:</strong> One or more items do not have enough stock in warehouse.
                  The system will attempt atomic deduction.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review & Dispatch */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'hsl(var(--bg-surface) / 0.5)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border-subtle))',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--text-muted))',
                    marginBottom: '0.5rem',
                  }}
                >
                  Allocation Dispatch Summary
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Selected Kit:</span>{' '}
                    <strong style={{ color: 'hsl(var(--text-primary))' }}>{activeSet?.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Kit Quantity:</span>{' '}
                    <strong style={{ color: 'hsl(var(--text-primary))' }}>
                      {setQuantity} per person
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Total Recipients:</span>{' '}
                    <strong style={{ color: 'hsl(var(--text-primary))' }}>
                      {selectedEmployeeIds.length} employee(s)
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Total Allocations:</span>{' '}
                    <strong style={{ color: 'hsl(var(--color-brand-accent))' }}>
                      {selectedEmployeeIds.length} records
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'hsl(var(--text-secondary))',
                    marginBottom: '0.25rem',
                  }}
                >
                  Dispatch Notes & Deployment Details
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Q3 Site Deployment for Security Operations batch #104"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'hsl(var(--bg-surface) / 0.7)',
                    border: '1px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-primary))',
                    resize: 'none',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid hsl(var(--border-subtle))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handleBack}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.825rem',
              color: 'hsl(var(--text-secondary))',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            {currentStep === 1 ? 'Cancel' : '← Back'}
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                backgroundColor: 'hsl(var(--color-brand-accent))',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 2px 8px hsl(var(--color-brand-accent) / 0.3)',
                cursor: 'pointer',
              }}
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDispatch}
              style={{
                padding: '0.5rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                backgroundColor: 'hsl(var(--color-brand-accent))',
                color: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 2px 12px hsl(var(--color-brand-accent) / 0.4)',
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Dispatching...' : '🚀 Confirm & Dispatch Allocations'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
