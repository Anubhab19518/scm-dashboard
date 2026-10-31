'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ItemCategory } from '../../types';
import { ScmApiService } from '../../services/scm-api.service';
import { useToast } from '../shared/toast-provider';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated: () => void;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  onCategoriesUpdated,
}: CategoryManagerModalProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ScmApiService.listCategories(true);
      setCategories(data);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);

  const resetForm = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Category name is required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await ScmApiService.updateCategory(editingId, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        showToast('Category updated successfully', 'success');
      } else {
        if (!code.trim()) {
          showToast('Category code is required', 'warning');
          setIsSubmitting(false);
          return;
        }
        await ScmApiService.createCategory({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          isActive: true,
        });
        showToast('Category created successfully', 'success');
      }
      resetForm();
      await loadCategories();
      onCategoriesUpdated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Category operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cat: ItemCategory) => {
    setEditingId(cat.id);
    setCode(cat.code);
    setName(cat.name);
    setDescription(cat.description || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await ScmApiService.deleteCategory(id);
      showToast('Category deleted', 'success');
      await loadCategories();
      onCategoriesUpdated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete category', 'error');
    }
  };

  if (!isOpen) return null;

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
          maxWidth: '680px',
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
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
            Manage Item Categories
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ color: 'hsl(var(--text-muted))', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Create / Edit Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '1rem',
              backgroundColor: 'hsl(var(--bg-surface) / 0.5)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '0.75rem',
              }}
            >
              {editingId ? 'Edit Category' : 'Add New Category'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'hsl(var(--text-secondary))',
                    marginBottom: '0.25rem',
                  }}
                >
                  Code *
                </label>
                <input
                  type="text"
                  disabled={Boolean(editingId)}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SAFETY_PPE"
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.825rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'hsl(var(--bg-secondary))',
                    border: '1px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-primary))',
                  }}
                />
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
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Safety & PPE Gear"
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.825rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'hsl(var(--bg-secondary))',
                    border: '1px solid hsl(var(--border-subtle))',
                    color: 'hsl(var(--text-primary))',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--text-secondary))',
                  marginBottom: '0.25rem',
                }}
              >
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of items in this category"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.825rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  border: '1px solid hsl(var(--border-subtle))',
                  color: 'hsl(var(--text-primary))',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    color: 'hsl(var(--text-secondary))',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: 'hsl(var(--color-brand-accent))',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                {isSubmitting ? 'Saving...' : editingId ? 'Update Category' : '+ Add Category'}
              </button>
            </div>
          </form>

          {/* Categories List */}
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: '0.5rem',
              }}
            >
              Existing Categories ({categories.length})
            </div>

            {isLoading ? (
              <div
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: 'hsl(var(--text-muted))',
                  fontSize: '0.85rem',
                }}
              >
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: 'hsl(var(--text-muted))',
                  fontSize: '0.85rem',
                }}
              >
                No categories found. Create your first category above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'hsl(var(--bg-surface) / 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border-subtle))',
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
                          {cat.code}
                        </span>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'hsl(var(--text-primary))',
                          }}
                        >
                          {cat.name}
                        </span>
                      </div>
                      {cat.description && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'hsl(var(--text-muted))',
                            marginTop: '0.15rem',
                          }}
                        >
                          {cat.description}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(cat)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.72rem',
                          color: 'hsl(var(--color-brand-accent))',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.72rem',
                          color: 'hsl(var(--color-danger))',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
