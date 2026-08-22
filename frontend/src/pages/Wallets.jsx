import { useState, useEffect } from 'react';
import { walletsAPI } from '../services/api';
import { formatCurrency, getWalletTypeInfo } from '../utils/helpers';
import Modal from '../components/ui/Modal';
import { Plus, Pencil, Trash2, Wallet, AlertTriangle } from 'lucide-react';

export default function Wallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingWallet, setEditingWallet] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'bank', balance: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchWallets(); }, []);

  const fetchWallets = async () => {
    try {
      const data = await walletsAPI.getAll();
      setWallets(data);
    } catch (err) {
      console.error('Failed to fetch wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingWallet(null);
    setForm({ name: '', type: 'bank', balance: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (wallet) => {
    setEditingWallet(wallet);
    setForm({ name: wallet.name, type: wallet.type, balance: wallet.balance.toString() });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        type: form.type,
        ...(form.balance !== '' && { balance: parseInt(form.balance, 10) }),
      };

      if (editingWallet) {
        await walletsAPI.update(editingWallet.id, payload);
      } else {
        await walletsAPI.create(payload);
      }
      setModalOpen(false);
      fetchWallets();
    } catch (err) {
      setFormError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setSubmitting(true);
    try {
      await walletsAPI.delete(deleteModal.id);
      setDeleteModal(null);
      fetchWallets();
    } catch (err) {
      setFormError(err.message || 'Failed to delete.');
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

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Wallets</h1>
            <p>Manage your bank accounts, e-wallets, and cash</p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Add Wallet
          </button>
        </div>
      </div>

      {wallets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Wallet size={28} /></div>
          <h3>No wallets yet</h3>
          <p>Create your first wallet to start tracking your finances.</p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Add Wallet
          </button>
        </div>
      ) : (
        <div className="wallet-grid">
          {wallets.map((wallet) => {
            const typeInfo = getWalletTypeInfo(wallet.type);
            return (
              <div key={wallet.id} className={`card wallet-card ${wallet.type}`}>
                <div className="card-header">
                  <span className={`badge badge-${wallet.type}`}>
                    {typeInfo.emoji} {typeInfo.label}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(wallet)} aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteModal(wallet)} aria-label="Delete" style={{ color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="wallet-name">{wallet.name}</div>
                <div className="wallet-balance">{formatCurrency(wallet.balance)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWallet ? 'Edit Wallet' : 'New Wallet'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <div className="spinner"></div> : (editingWallet ? 'Save Changes' : 'Create Wallet')}
            </button>
          </>
        }
      >
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="wallet-name">Wallet Name</label>
            <input
              id="wallet-name"
              className="form-input"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. BCA Savings"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="wallet-type">Type</label>
            <select
              id="wallet-type"
              className="form-input form-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="bank">🏦 Bank</option>
              <option value="ewallet">📱 E-Wallet</option>
              <option value="cash">💵 Cash</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="wallet-balance">
              {editingWallet ? 'Balance' : 'Initial Balance'} (in smallest unit)
            </label>
            <input
              id="wallet-balance"
              className="form-input"
              type="number"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              placeholder="e.g. 15000000 for Rp 150.000"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Wallet"
      >
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon"><AlertTriangle size={28} /></div>
          <h3>Delete &quot;{deleteModal?.name}&quot;?</h3>
          <p>This will permanently delete this wallet and all its transactions. This action cannot be undone.</p>
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
