import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI, walletsAPI, categoriesAPI } from '../services/api';
import { formatCurrency, formatDate, formatDateForInput, getTodayDate } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import { Plus, Pencil, Trash2, ArrowLeftRight, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [form, setForm] = useState({
    wallet_id: '',
    category_id: '',
    amount: '',
    transaction_date: getTodayDate(),
    notes: '',
    tags: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTransactions = useCallback(async (page = 1) => {
    try {
      const res = await transactionsAPI.getAll(page);
      setTransactions(res.data.data);
      setPagination({
        currentPage: res.data.current_page,
        lastPage: res.data.last_page,
        total: res.data.total,
        perPage: res.data.per_page,
      });
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFormData = async () => {
    try {
      const [walletsRes, categoriesRes] = await Promise.all([
        walletsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setWallets(walletsRes.data.wallets);
      setCategories(categoriesRes.data.categories);
    } catch (err) {
      console.error('Failed to fetch form data:', err);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
    fetchFormData();
  }, [currentPage, fetchTransactions]);

  const openCreateModal = () => {
    setEditingTransaction(null);
    setForm({
      wallet_id: wallets.length > 0 ? wallets[0].id.toString() : '',
      category_id: categories.length > 0 ? categories[0].id.toString() : '',
      amount: '',
      transaction_date: getTodayDate(),
      notes: '',
      tags: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (txn) => {
    setEditingTransaction(txn);
    setForm({
      wallet_id: txn.wallet_id.toString(),
      category_id: txn.category_id.toString(),
      amount: txn.amount.toString(),
      transaction_date: formatDateForInput(txn.transaction_date),
      notes: txn.notes || '',
      tags: txn.tags || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        wallet_id: parseInt(form.wallet_id, 10),
        category_id: parseInt(form.category_id, 10),
        amount: parseInt(form.amount, 10),
        transaction_date: form.transaction_date,
        notes: form.notes || null,
        tags: form.tags || null,
      };

      if (editingTransaction) {
        await transactionsAPI.update(editingTransaction.id, payload);
      } else {
        await transactionsAPI.create(payload);
      }
      setModalOpen(false);
      fetchTransactions(currentPage);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        setFormError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setFormError(err.response?.data?.message || 'Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setSubmitting(true);
    try {
      await transactionsAPI.delete(deleteModal.id);
      setDeleteModal(null);
      fetchTransactions(currentPage);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryType = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.type || 'expense';
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '50vh' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Transactions</h1>
            <p>Track all your income and expense transactions</p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Add Transaction
          </button>
        </div>
      </div>

      {transactions.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ArrowLeftRight size={28} /></div>
          <h3>No transactions yet</h3>
          <p>Record your first transaction to start tracking.</p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Add Transaction
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Wallet</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => {
                  const catType = txn.category?.type || getCategoryType(txn.category_id);
                  const isIncome = catType === 'income';
                  return (
                    <tr key={txn.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(txn.transaction_date)}</td>
                      <td>
                        <span className={`badge badge-${catType}`}>
                          {txn.category?.name || `Cat #${txn.category_id}`}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {txn.wallet?.name || `Wallet #${txn.wallet_id}`}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {txn.notes || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`amount ${isIncome ? 'income' : 'expense'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(txn)} aria-label="Edit">
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteModal(txn)} aria-label="Delete" style={{ color: 'var(--danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.lastPage > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={pagination.currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} total)
              </span>
              <button
                className="pagination-btn"
                disabled={pagination.currentPage >= pagination.lastPage}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <div className="spinner"></div> : (editingTransaction ? 'Save Changes' : 'Create Transaction')}
            </button>
          </>
        }
      >
        {formError && <div className="alert alert-error"><AlertCircle size={16} />{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="txn-wallet">Wallet</label>
            <select
              id="txn-wallet"
              className="form-input form-select"
              value={form.wallet_id}
              onChange={(e) => setForm({ ...form, wallet_id: e.target.value })}
              required
            >
              <option value="">Select wallet...</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-category">Category</label>
            <select
              id="txn-category"
              className="form-input form-select"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              required
            >
              <option value="">Select category...</option>
              <optgroup label="📈 Income">
                {categories.filter(c => c.type === 'income').map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="📉 Expense">
                {categories.filter(c => c.type === 'expense').map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-amount">Amount (smallest unit)</label>
            <input
              id="txn-amount"
              className="form-input"
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="e.g. 5000000 for Rp 50.000"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-date">Date</label>
            <input
              id="txn-date"
              className="form-input"
              type="date"
              value={form.transaction_date}
              onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-notes">Notes</label>
            <textarea
              id="txn-notes"
              className="form-input form-textarea"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional description..."
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-tags">Tags</label>
            <input
              id="txn-tags"
              className="form-input"
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="e.g. groceries, monthly"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Transaction"
      >
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon"><AlertTriangle size={28} /></div>
          <h3>Delete this transaction?</h3>
          <p>The wallet balance will be adjusted accordingly. This action cannot be undone.</p>
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
