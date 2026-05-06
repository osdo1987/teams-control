import React, { useState } from 'react';
import { paymentService } from '../../services/paymentService';
import Modal from '../../components/UI/Modal';

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
  const [formData, setFormData] = useState({ athlete_id: '', amount: '', status: 'PAID', payment_method: 'Cash', description: '' });

  const fetchPayments = async () => {
    if (!athleteIdSearch) return;
    setLoading(true);
    try {
      const data = await paymentService.getAthletePayments(athleteIdSearch);
      setPayments(data); setError('');
    } catch { setError('No payments found for this athlete.'); setPayments([]); }
    finally { setLoading(false); }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreatePayment = async e => {
    e.preventDefault();
    try {
      await paymentService.createPayment({ athlete_id: parseInt(formData.athlete_id), amount: parseFloat(formData.amount), status: formData.status, payment_method: formData.payment_method, description: formData.description });
      setIsModalOpen(false);
      if (String(athleteIdSearch) === String(formData.athlete_id)) fetchPayments();
    } catch (err) { setError(err.message || 'Error registering payment'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p className="text-muted">Track and manage athlete fee payments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Register Payment</button>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.9rem' }}>Search by Athlete ID</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="number" value={athleteIdSearch} onChange={e => setAthleteIdSearch(e.target.value)}
            className="form-input" placeholder="Enter athlete ID..." style={{ maxWidth: 280 }}
            onKeyDown={e => e.key === 'Enter' && fetchPayments()}
          />
          <button className="btn btn-primary" onClick={fetchPayments}>Search</button>
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
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Search for an athlete to see their payments.</td></tr>
              ) : payments.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>#{p.id}</td>
                  <td><span className="badge badge-primary">ID {p.athlete_id}</span></td>
                  <td>{p.description}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${p.amount?.toLocaleString()}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.payment_method}</td>
                  <td><span className={statusBadge(p.status)}>{p.status}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{p.date ? new Date(p.date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Payment">
        <form onSubmit={handleCreatePayment} style={{ display: 'contents' }}>
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
            <button type="submit" className="btn btn-primary">Register Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentList;
