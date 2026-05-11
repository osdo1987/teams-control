import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/paymentService';
import { athleteService } from '../../services/athleteService';
import { groupService } from '../../services/groupService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';

const PaymentList = () => {
  const [athletes, setAthletes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filtros Globales
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros por Grupo (Almacenamos el estado de filtro de cada grupo en un objeto {groupId: 'all' | 'paid' | 'unpaid'})
  const [groupFilters, setGroupFilters] = useState({});

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [athleteHistory, setAthleteHistory] = useState([]);
  const [formData, setFormData] = useState({ athlete_id: '', amount: '', status: 'PAID', payment_method: 'Efectivo', description: '' });

  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [athletesData, groupsData, paymentsData] = await Promise.all([
        athleteService.getAthletes(),
        groupService.getGroups(),
        paymentService.getPayments()
      ]);
      setAthletes(athletesData);
      setGroups(groupsData);
      setPayments(paymentsData);
    } catch {
      setError('Error al cargar la información financiera.');
    } finally {
      setLoading(false);
    }
  };

  const getAthleteStatus = (athleteId) => {
    return payments.some(p => {
      const pDate = new Date(p.payment_date);
      return p.athlete_id === athleteId && 
             p.status === 'PAID' && 
             pDate.getMonth() === selectedMonth && 
             pDate.getFullYear() === selectedYear;
    });
  };

  // Cálculo de métricas filtradas por MES
  const monthlyMetrics = (() => {
    const filtered = payments.filter(p => {
      const pDate = new Date(p.payment_date);
      return pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear;
    });
    
    return {
      received: filtered.filter(p => p.status === 'PAID').reduce((acc, p) => acc + Number(p.amount), 0),
      pending: filtered.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + Number(p.amount), 0),
      count: filtered.length
    };
  })();

  const openQuickPayment = (athlete) => {
    const group = athlete.current_groups?.[0];
    setFormData({
      athlete_id: athlete.id,
      amount: group?.monthly_fee || '',
      status: 'PAID',
      payment_method: 'Efectivo',
      description: `Mensualidad ${months[selectedMonth]} - ${group?.name || 'General'}`
    });
    setSelectedAthlete(athlete);
    setIsModalOpen(true);
  };

  const openHistory = async (athlete) => {
    setSelectedAthlete(athlete);
    try {
      const history = await paymentService.getAthletePayments(athlete.id);
      setAthleteHistory(history);
      setIsHistoryModalOpen(true);
    } catch {
      setError('Error al cargar el historial.');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await paymentService.createPayment({
        ...formData,
        athlete_id: parseInt(formData.athlete_id),
        amount: parseFloat(formData.amount)
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err) { setError('Error al registrar el pago.'); }
  };

  if (loading && athletes.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando panel financiero...</div>;

  const renderAthleteTable = (groupAthletes, groupId) => {
    const currentFilter = groupFilters[groupId] || 'all';
    
    const filteredList = groupAthletes.filter(athlete => {
      const hasPaid = getAthleteStatus(athlete.id);
      if (currentFilter === 'paid') return hasPaid;
      if (currentFilter === 'unpaid') return !hasPaid;
      return true;
    });

    return (
      <div className="card" style={{ marginBottom: '24px', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{groupId === 'none' ? 'Atletas sin Grupo' : groups.find(g => g.id === groupId)?.name}</h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{filteredList.length} atletas mostrados</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filtro:</span>
            <select 
              className="form-input" 
              style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', height: 'auto' }}
              value={currentFilter}
              onChange={(e) => setGroupFilters({...groupFilters, [groupId]: e.target.value})}
            >
              <option value="all">Todos</option>
              <option value="paid">Pagados</option>
              <option value="unpaid">Pendientes</option>
            </select>
          </div>
        </div>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Atleta</th>
              <th>Identificación</th>
              <th style={{ textAlign: 'center' }}>Estado {months[selectedMonth]}</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map(athlete => {
              const hasPaid = getAthleteStatus(athlete.id);
              return (
                <tr key={athlete.id}>
                  <td>
                    <button onClick={() => openHistory(athlete)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}>
                      {athlete.user?.first_name} {athlete.user?.last_name}
                    </button>
                  </td>
                  <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{athlete.user?.identification_number}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={hasPaid ? "badge badge-success" : "badge badge-danger"}>
                      {hasPaid ? "PAGADO" : "PENDIENTE"}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!hasPaid && (
                      <button className="btn btn-primary btn-sm" onClick={() => openQuickPayment(athlete)}>⚡ Pago Rápido</button>
                    )}
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: '8px' }} onClick={() => openHistory(athlete)}>📜 Historial</button>
                  </td>
                </tr>
              );
            })}
            {filteredList.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No hay atletas con este filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Control de Pagos</h1>
          <p className="text-muted">Estado de mensualidades y recaudos.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select className="form-input" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={{ width: '130px' }}>
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select className="form-input" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ width: '100px' }}>
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Métricas Mensuales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RECAUDADO ({months[selectedMonth].toUpperCase()})</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${monthlyMetrics.received.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PENDIENTE ({months[selectedMonth].toUpperCase()})</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${monthlyMetrics.pending.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TRANSACCIONES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{monthlyMetrics.count}</div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o identificación..."
          className="form-input"
          style={{ borderRadius: '12px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      {/* Renderizado de Grupos */}
      {groups.map(group => {
        const groupAthletes = athletes.filter(a => 
          a.current_groups?.some(g => g.id === group.id) &&
          (`${a.user?.first_name} ${a.user?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
           a.user?.identification_number.includes(searchTerm))
        );
        if (groupAthletes.length === 0 && searchTerm) return null;
        return renderAthleteTable(groupAthletes, group.id);
      })}

      {/* Atletas sin grupo */}
      {(() => {
        const unassigned = athletes.filter(a => 
          (!a.current_groups || a.current_groups.length === 0) &&
          (`${a.user?.first_name} ${a.user?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
           a.user?.identification_number.includes(searchTerm))
        );
        if (unassigned.length > 0) return renderAthleteTable(unassigned, 'none');
        return null;
      })()}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Registrar Pago: ${selectedAthlete?.user?.first_name}`}>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Concepto</label>
            <input type="text" name="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="form-input" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Monto ($)</label>
              <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Método</label>
              <select value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})} className="form-input">
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </div>
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Confirmar Pago</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Historial: ${selectedAthlete?.user?.first_name} ${selectedAthlete?.user?.last_name}`}>
        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {athleteHistory.map(h => (
                <tr key={h.id}>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(h.payment_date).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.85rem' }}>{h.description}</td>
                  <td style={{ fontWeight: 600 }}>${Number(h.amount).toLocaleString()}</td>
                  <td><span className={h.status === 'PAID' ? 'badge badge-success' : 'badge badge-warning'}>{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentList;
