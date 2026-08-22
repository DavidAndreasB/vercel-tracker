import { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import Modal from '../components/ui/Modal';
import { Plus, Pencil, Trash2, Tag, TrendingUp, TrendingDown, AlertTriangle, AlertCircle } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'expense' });
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const openCreateModal = (type = 'expense') => {
    setEditingCategory(null);
    setForm({ name: '', type });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({ name: category.name, type: category.type });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, form);
      } else {
        await categoriesAPI.create(form);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setSubmitting(true);
    setDeleteError('');
    try {
      await categoriesAPI.delete(deleteModal.id);
      setDeleteModal(null);
      fetchCategories();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete category.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '50vh' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  const renderCategoryColumn = (title, icon, items, type) => (
    <div className="category-column">
      <h2>
        {icon}
        {title}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => openCreateModal(type)}
          style={{ marginLeft: 'auto' }}
        >
          <Plus size={16} />
        </button>
      </h2>
      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <p>No {type} categories yet</p>
        </div>
      ) : (
        <div className="category-list">
          {items.map((cat) => (
            <div key={cat.id} className="category-item">
              <div className="category-item-info">
                <span className={`badge badge-${cat.type}`}>{cat.type}</span>
                <span style={{ fontWeight: 500 }}>{cat.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(cat)} aria-label="Edit">
                  <Pencil size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setDeleteError(''); setDeleteModal(cat); }}
                  aria-label="Delete"
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Categories</h1>
            <p>Organize your income and expense categories</p>
          </div>
          <button className="btn btn-primary" onClick={() => openCreateModal()}>
            <Plus size={18} /> Add Category
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Tag size={28} /></div>
          <h3>No categories yet</h3>
          <p>Create categories to organize your transactions.</p>
          <button className="btn btn-primary" onClick={() => openCreateModal()}>
            <Plus size={18} /> Add Category
          </button>
        </div>
      ) : (
        <div className="categories-layout">
          {renderCategoryColumn(
            'Income',
            <TrendingUp size={20} style={{ color: 'var(--success)' }} />,
            incomeCategories,
            'income'
          )}
          {renderCategoryColumn(
            'Expense',
            <TrendingDown size={20} style={{ color: 'var(--danger)' }} />,
            expenseCategories,
            'expense'
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'New Category'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <div className="spinner"></div> : (editingCategory ? 'Save Changes' : 'Create Category')}
            </button>
          </>
        }
      >
        {formError && <div className="alert alert-error"><AlertCircle size={16} />{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="cat-name">Category Name</label>
            <input
              id="cat-name"
              className="form-input"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Groceries"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cat-type">Type</label>
            <select
              id="cat-type"
              className="form-input form-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="income">📈 Income</option>
              <option value="expense">📉 Expense</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Category"
      >
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon"><AlertTriangle size={28} /></div>
          <h3>Delete &quot;{deleteModal?.name}&quot;?</h3>
          <p>This category will be permanently removed.</p>
          {deleteError && (
            <div className="alert alert-error" style={{ textAlign: 'left' }}>
              <AlertCircle size={16} />{deleteError}
            </div>
          )}
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
              {submitting ? <div className="spinner"></div> : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
