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
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  const [groupFilters, setGroupFilters] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({}); // {groupId: true/false}

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

  // --- CÁLCULO FINANCIERO REAL ---
  const monthlyMetrics = (() => {
    let totalReceived = 0;
    let totalPending = 0;
    
    // 1. Sumar lo que ya se recibió este mes
    const paidThisMonth = payments.filter(p => {
      const pDate = new Date(p.payment_date);
      return p.status === 'PAID' && pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear;
    });
    totalReceived = paidThisMonth.reduce((acc, p) => acc + Number(p.amount), 0);

    // 2. Calcular lo pendiente (Atletas que NO han pagado este mes * su mensualidad)
    athletes.forEach(athlete => {
      const hasPaid = getAthleteStatus(athlete.id);
      if (!hasPaid) {
        // Si no ha pagado, sumamos el costo de su grupo (o un default si no tiene)
        const groupFee = athlete.current_groups?.[0]?.monthly_fee || 0;
        totalPending += Number(groupFee);
      }
    });
    
    return { received: totalReceived, pending: totalPending, count: paidThisMonth.length };
  })();

  const toggleCollapse = (id) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
    } catch { setError('Error al cargar el historial.'); }
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

  const renderAthleteTable = (groupAthletes, groupId) => {
    const isCollapsed = collapsedGroups[groupId];
    const currentFilter = groupFilters[groupId] || 'all';
    
    const filteredList = groupAthletes.filter(athlete => {
      const hasPaid = getAthleteStatus(athlete.id);
      if (currentFilter === 'paid') return hasPaid;
      if (currentFilter === 'unpaid') return !hasPaid;
      return true;
    });

    return (
      <div className="card" style={{ marginBottom: '16px', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', background: 'var(--bg-main)', borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => toggleCollapse(groupId)}>
            <span style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '0.8rem' }}>▼</span>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                {groupId === 'none' ? 'Atletas sin Grupo' : groups.find(g => g.id === groupId)?.name}
              </h3>
              {!isCollapsed && <span className="text-muted" style={{ fontSize: '0.72rem' }}>{filteredList.length} atletas en lista</span>}
            </div>
          </div>
          {!isCollapsed && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select 
                className="form-input" 
                style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', height: 'auto', borderRadius: '8px' }}
                value={currentFilter}
                onChange={(e) => setGroupFilters({...groupFilters, [groupId]: e.target.value})}
              >
                <option value="all">Todos</option>
                <option value="paid">Pagados</option>
                <option value="unpaid">Pendientes</option>
              </select>
            </div>
          )}
          {isCollapsed && (
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              {groupAthletes.filter(a => getAthleteStatus(a.id)).length} / {groupAthletes.length} Pagados
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <table className="data-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Atleta</th>
                <th>ID</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(athlete => {
                const hasPaid = getAthleteStatus(athlete.id);
                return (
                  <tr key={athlete.id}>
                    <td>
                      <button onClick={() => openHistory(athlete)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontSize: '0.88rem' }}>
                        {athlete.user?.first_name} {athlete.user?.last_name}
                      </button>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{athlete.user?.identification_number}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={hasPaid ? "badge badge-success" : "badge badge-danger"} style={{ fontSize: '0.65rem' }}>
                        {hasPaid ? "PAGADO" : "PENDIENTE"}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!hasPaid && <button className="btn btn-primary btn-sm" onClick={() => openQuickPayment(athlete)}>⚡ Pagar</button>}
                      <button className="btn btn-ghost btn-sm" style={{ marginLeft: '6px' }} onClick={() => openHistory(athlete)}>📜 Historial</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>Control Financiero</h1>
          <p className="text-muted">Seguimiento mensual de recaudación por grupo.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select className="form-input" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={{ width: '130px', borderRadius: '10px' }}>
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select className="form-input" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ width: '100px', borderRadius: '10px' }}>
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderTop: '4px solid #10b981', background: '#f0fdf4' }}>
          <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700 }}>RECAUDADO EN {months[selectedMonth].toUpperCase()}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#065f46' }}>${monthlyMetrics.received.toLocaleString()}</div>
          <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '4px' }}>{monthlyMetrics.count} pagos registrados</div>
        </div>
        <div className="card" style={{ padding: '20px', borderTop: '4px solid #f59e0b', background: '#fffbeb' }}>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>PENDIENTE POR COBRAR</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#92400e' }}>${monthlyMetrics.pending.toLocaleString()}</div>
          <div style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '4px' }}>Basado en mensualidades de atletas activos</div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar atleta..."
          className="form-input"
          style={{ borderRadius: '14px', padding: '12px 20px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', width: '100%' }}>{error}</div>}

      {groups.map(group => {
        const groupAthletes = athletes.filter(a => 
          a.current_groups?.some(g => g.id === group.id) &&
          (`${a.user?.first_name} ${a.user?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        if (groupAthletes.length === 0 && searchTerm) return null;
        return renderAthleteTable(groupAthletes, group.id);
      })}

      {(() => {
        const unassigned = athletes.filter(a => 
          (!a.current_groups || a.current_groups.length === 0) &&
          (`${a.user?.first_name} ${a.user?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        if (unassigned.length > 0) return renderAthleteTable(unassigned, 'none');
      })()}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Registrar Pago - ${selectedAthlete?.user?.first_name}`}>
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
              </select>
            </div>
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Confirmar Pago</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Historial de ${selectedAthlete?.user?.first_name}`}>
        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Fecha</th><th>Descripción</th><th>Monto</th><th>Estado</th></tr>
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
