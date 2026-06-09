import React, { useState, useEffect } from 'react';
import { athleteService } from '../../services/athleteService';
import { groupService } from '../../services/groupService';
import { paymentService } from '../../services/paymentService';
import { authService } from '../../services/authService';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    athletes: 0,
    groups: 0,
    trainers: 0,
    recap: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [athletes = [], groups = [], payments = [], trainers = []] = await Promise.all([
        athleteService.getAthletes().catch(() => []),
        groupService.getGroups().catch(() => []),
        paymentService.getPayments().catch(() => []),
        authService.getTrainers().catch(() => [])
      ]);

      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();

      // Cálculo de pagos del mes
      const paidThisMonth = payments.filter(p => {
        const d = new Date(p.payment_date);
        return p.status === 'PAID' && d.getMonth() === month && d.getFullYear() === year;
      });

      const totalReceived = paidThisMonth.reduce((acc, p) => acc + Number(p.amount), 0);

      // Cálculo de pendientes
      let totalPending = 0;
      athletes.forEach(a => {
        const hasPaid = payments.some(p => {
          const d = new Date(p.payment_date);
          return p.athlete_id === a.id && p.status === 'PAID' && d.getMonth() === month && d.getFullYear() === year;
        });
        if (!hasPaid) {
          totalPending += Number(a.current_groups?.[0]?.monthly_fee || 0);
        }
      });

      setStats({
        athletes: athletes.length,
        groups: groups.length,
        trainers: trainers.length,
        recap: totalReceived,
        pending: totalPending
      });
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando resumen...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Panel de Control</h1>
          <p className="text-muted">Bienvenido al resumen de {user.club_name || 'tu club'}.</p>
        </div>
        <div style={{ padding: '10px 20px', background: 'var(--primary-color)', color: '#fff', borderRadius: '12px', fontWeight: 600 }}>
          {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).toUpperCase()}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card" style={{ borderBottom: '4px solid var(--primary-color)' }}>
          <div className="stat-label">ATLETAS</div>
          <div className="stat-value">{stats.athletes}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', marginTop: '4px' }}>Registrados activamente</div>
        </div>
        <div className="stat-card" style={{ borderBottom: '4px solid var(--success-color)' }}>
          <div className="stat-label">GRUPOS</div>
          <div className="stat-value">{stats.groups}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success-color)', marginTop: '4px' }}>Equipos en entrenamiento</div>
        </div>
        <div className="stat-card" style={{ borderBottom: '4px solid #8b5cf6' }}>
          <div className="stat-label">ENTRENADORES</div>
          <div className="stat-value">{stats.trainers}</div>
          <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '4px' }}>Personal técnico</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 700 }}>Resumen Financiero del Mes</h2>
      <div className="stat-grid">
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#f0fdf4' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>💰</div>
          <div>
            <div style={{ color: '#166534', fontWeight: 600, fontSize: '0.875rem' }}>RECAUDACIÓN ACTUAL</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#14532d', lineHeight: 1 }}>${stats.recap.toLocaleString()}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#fffbeb' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⏳</div>
          <div>
            <div style={{ color: '#92400e', fontWeight: 600, fontSize: '0.875rem' }}>PENDIENTE POR COBRAR</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#78350f', lineHeight: 1 }}>${stats.pending.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 700 }}>Acciones Rápidas</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/admin/attendance" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Tomar Asistencia Hoy</a>
          <a href="/admin/payments" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Registrar Pagos</a>
          <a href="/admin/users" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Ver Usuarios</a>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
