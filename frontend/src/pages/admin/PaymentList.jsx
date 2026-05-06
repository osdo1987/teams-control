import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/paymentService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';

const statusBadge = s => {
  if (s === 'PAID')    return 'badge badge-success';
  if (s === 'PENDING') return 'badge badge-warning';
  return 'badge badge-danger';
};

const PaymentList = () => {
  const [athleteIdSearch, setAthleteIdSearch] = useState('');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [formData, setFormData] = useState({ athlete_id: '', amount: '', status: 'PAID', payment_method: 'Cash', description: '' });

  useEffect(() => {
    fetchAllPayments();
  }, []);

  const fetchAllPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getPayments();
      setPayments(data);
    } catch {
      setError('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAthletePayments = async () => {
    if (!athleteIdSearch) {
      fetchAllPayments();
      return;
    }
    setLoading(true);
    try {
      const data = await paymentService.getAthletePayments(athleteIdSearch);
      setPayments(data); setError('');
    } catch { setError('No payments found for this athlete.'); setPayments([]); }
    finally { setLoading(false); }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openCreateModal = () => {
    setEditingPayment(null);
    setFormData({ athlete_id: '', amount: '', status: 'PAID', payment_method: 'Cash', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setFormData({
      athlete_id: payment.athlete_id,
      amount: payment.amount,
      status: payment.status,
      payment_method: payment.payment_method || 'Cash',
      description: payment.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        athlete_id: parseInt(formData.athlete_id),
        amount: parseFloat(formData.amount),
        status: formData.status,
        payment_method: formData.payment_method,
        description: formData.description
      };

      if (editingPayment) {
        await paymentService.updatePayment(editingPayment.id, payload);
      } else {
        await paymentService.createPayment(payload);
      }
      
      setIsModalOpen(false);
      if (athleteIdSearch) fetchAthletePayments();
      else fetchAllPayments();
    } catch (err) { setError(err.message || 'Error saving payment'); }
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      await paymentService.deletePayment(paymentToDelete.id);
      if (athleteIdSearch) fetchAthletePayments();
      else fetchAllPayments();
    } catch (err) {
      setError('Error deleting payment');
    } finally {
      setIsConfirmOpen(false);
      setPaymentToDelete(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p className="text-muted">Track and manage athlete fee payments.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ Register Payment</button>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.9rem' }}>Search by Athlete ID</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="number" value={athleteIdSearch} onChange={e => setAthleteIdSearch(e.target.value)}
            className="form-input" placeholder="Enter athlete ID (leave empty for all)..." style={{ maxWidth: 280 }}
            onKeyDown={e => e.key === 'Enter' && fetchAthletePayments()}
          />
          <button className="btn btn-primary" onClick={fetchAthletePayments}>Search</button>
          <button className="btn btn-ghost" onClick={() => { setAthleteIdSearch(''); fetchAllPayments(); }}>Clear</button>
        </div>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Athlete ID</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No payments found.</td></tr>
              ) : payments.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>#{p.id}</td>
                  <td><span className="badge badge-primary">ID {p.athlete_id}</span></td>
                  <td>{p.description}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${p.amount?.toLocaleString()}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.payment_method}</td>
                  <td><span className={statusBadge(p.status)}>{p.status}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(p)}>Edit</button>
                      <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                        onClick={() => { setPaymentToDelete(p); setIsConfirmOpen(true); }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Delete Payment"
        message={`Are you sure you want to delete this payment record of $${paymentToDelete?.amount}?`}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPayment ? "Edit Payment" : "Register Payment"}>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Athlete ID</label>
            <input type="number" name="athlete_id" value={formData.athlete_id} onChange={handleInputChange} className="form-input" required placeholder="e.g. 1" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="form-input" required placeholder="Monthly Fee" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleInputChange} className="form-input" required placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Method</label>
              <select name="payment_method" value={formData.payment_method} onChange={handleInputChange} className="form-input">
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className="form-input">
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingPayment ? "Save Changes" : "Register Payment"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentList;
