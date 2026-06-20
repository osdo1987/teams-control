import React, { useState, useEffect, useMemo } from 'react';
import { paymentService } from '../../services/paymentService';
import { athleteService } from '../../services/athleteService';
import { groupService } from '../../services/groupService';
import Modal from '../../components/UI/Modal';
import { useToast } from '../../contexts/ToastContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const PaymentList = () => {
  const [athletes, setAthletes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'paid' | 'pending'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [athleteHistory, setAthleteHistory] = useState([]);
  const [formData, setFormData] = useState({
    athlete_id: '',
    amount: '',
    status: 'PAID',
    payment_method: 'Efectivo',
    description: ''
  });

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const PAYMENT_METHODS = [
    { value: 'Efectivo', label: 'Efectivo', icon: '💵' },
    { value: 'Nequi', label: 'Nequi', icon: '📱' },
    { value: 'Transferencia', label: 'Transferencia Bancaria', icon: '🏦' },
    { value: 'Tarjeta', label: 'Tarjeta (Datafono)', icon: '💳' }
  ];

  const getMethodIcon = (method) => {
    const found = PAYMENT_METHODS.find(m => m.value === method);
    return found ? found.icon : '💳';
  };

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
    } catch (err) {
      showError(err.message || 'Error al cargar la información financiera.');
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

  const getAthleteGroup = (athlete) => {
    return athlete.current_groups?.[0] || null;
  };

  // ─── MÉTRICAS ───────────────────────────────────────────────
  const monthlyMetrics = useMemo(() => {
    let totalReceived = 0;
    let totalPending = 0;

    const paidThisMonth = payments.filter(p => {
      const pDate = new Date(p.payment_date);
      return p.status === 'PAID' && pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear;
    });
    totalReceived = paidThisMonth.reduce((acc, p) => acc + Number(p.amount), 0);

    athletes.forEach(athlete => {
      const hasPaid = getAthleteStatus(athlete.id);
      if (!hasPaid) {
        const groupFee = athlete.current_groups?.[0]?.monthly_fee || 0;
        totalPending += Number(groupFee);
      }
    });

    const totalExpected = totalReceived + totalPending;
    const collectionRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

    return { received: totalReceived, pending: totalPending, count: paidThisMonth.length, rate: collectionRate };
  }, [payments, athletes, selectedMonth, selectedYear]);

  // ─── DATOS PARA GRÁFICOS ────────────────────────────────────
  const revenueChartData = useMemo(() => {
    const monthsData = monthLabels.map((label, idx) => {
      const paidInMonth = payments.filter(p => {
        const pDate = new Date(p.payment_date);
        return p.status === 'PAID' && pDate.getMonth() === idx && pDate.getFullYear() === selectedYear;
      });
      const received = paidInMonth.reduce((acc, p) => acc + Number(p.amount), 0);

      const pendingInMonth = athletes.filter(a => {
        const hasPaid = payments.some(p => {
          const pDate = new Date(p.payment_date);
          return p.athlete_id === a.id && p.status === 'PAID' && pDate.getMonth() === idx && pDate.getFullYear() === selectedYear;
        });
        return !hasPaid;
      });
      const pending = pendingInMonth.reduce((acc, a) => {
        const fee = a.current_groups?.[0]?.monthly_fee || 0;
        return acc + Number(fee);
      }, 0);

      return { name: label, Recaudado: received, Pendiente: pending };
    });
    return monthsData;
  }, [payments, athletes, selectedYear]);

  const paymentMethodData = useMemo(() => {
    const paidThisMonth = payments.filter(p => {
      const pDate = new Date(p.payment_date);
      return p.status === 'PAID' && pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear;
    });

    const methodTotals = {};
    paidThisMonth.forEach(p => {
      const method = p.payment_method || 'Efectivo';
      methodTotals[method] = (methodTotals[method] || 0) + Number(p.amount);
    });

    return Object.entries(methodTotals).map(([name, value]) => ({ name, value }));
  }, [payments, selectedMonth, selectedYear]);

  const METHOD_COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B'];

  // ─── TRANSACCIONES PARA TABLA ───────────────────────────────
  const transactions = useMemo(() => {
    const allTransactions = [];

    // Pagos registrados
    payments.forEach(p => {
      const pDate = new Date(p.payment_date);
      if (pDate.getMonth() !== selectedMonth || pDate.getFullYear() !== selectedYear) return;

      const athlete = athletes.find(a => a.id === p.athlete_id);
      if (!athlete) return;

      const group = getAthleteGroup(athlete);
      allTransactions.push({
        id: `p-${p.id}`,
        type: 'payment',
        athlete,
        group,
        concept: p.description || `Mensualidad ${months[selectedMonth]}`,
        method: p.payment_method || 'Efectivo',
        date: p.payment_date,
        amount: Number(p.amount),
        status: p.status === 'PAID' ? 'paid' : 'pending',
        paymentId: p.id
      });
    });

    // Atletas sin pago (pendientes)
    athletes.forEach(athlete => {
      const hasPaid = getAthleteStatus(athlete.id);
      if (hasPaid) return;

      const group = getAthleteGroup(athlete);
      const fee = group?.monthly_fee || 0;
      if (fee === 0) return;

      allTransactions.push({
        id: `a-${athlete.id}`,
        type: 'pending',
        athlete,
        group,
        concept: `Mensualidad ${months[selectedMonth]}`,
        method: 'Pendiente',
        date: null,
        amount: Number(fee),
        status: 'pending',
        paymentId: null
      });
    });

    // Filtrar por búsqueda
    let filtered = allTransactions;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        `${t.athlete.user?.first_name} ${t.athlete.user?.last_name}`.toLowerCase().includes(term) ||
        (t.group?.name || '').toLowerCase().includes(term)
      );
    }

    // Filtrar por estado
    if (filterStatus === 'paid') filtered = filtered.filter(t => t.status === 'paid');
    if (filterStatus === 'pending') filtered = filtered.filter(t => t.status === 'pending');

    // Ordenar: pagados primero por fecha descendente, luego pendientes
    filtered.sort((a, b) => {
      if (a.status === 'paid' && b.status === 'pending') return -1;
      if (a.status === 'pending' && b.status === 'paid') return 1;
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      return 0;
    });

    return filtered;
  }, [payments, athletes, selectedMonth, selectedYear, searchTerm, filterStatus]);

  // ─── ACCIONES ───────────────────────────────────────────────
  const openQuickPayment = (athlete) => {
    const group = getAthleteGroup(athlete);
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
      showError('Error al cargar el historial.');
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
      showSuccess('Pago registrado correctamente');
    } catch (err) {
      showError(err.message || 'Error al registrar el pago.');
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const totalCount = transactions.length;
  const paidCount = transactions.filter(t => t.status === 'paid').length;
  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  // ─── RENDER ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Cargando información financiera...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ width: '100%', margin: '-28px -36px -48px', padding: '28px 36px 48px' }}>
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1>Control Financiero</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Analítica de ingresos, métodos de pago y estados de cuenta.
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            padding: '10px 16px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-primary)'
          }}>
            📅 {months[selectedMonth]} {selectedYear}
          </div>
          <button className="btn btn-outline" style={{ gap: '8px' }}>
            ⬇️ Exportar Reporte
          </button>
        </div>
      </div>

      {/* KPIs PRINCIPALES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            Ingresos Totales (Mes)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)' }}>
            {formatCurrency(monthlyMetrics.received)}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ▲ 12% vs Mes Anterior
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            Pendiente por Cobrar
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-1px', color: '#EF4444' }}>
            {formatCurrency(monthlyMetrics.pending)}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ▼ 4% vs Mes Anterior
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            Tasa de Cobro Eficaz
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-1px', color: '#10B981' }}>
            {monthlyMetrics.rate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ▲ 2% vs Mes Anterior
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '16px' }}>
            Tendencia de Ingresos vs Pendientes
          </div>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [formatCurrency(value), undefined]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => <span style={{ color: '#0F172A', fontSize: '13px' }}>{value}</span>}
                />
                <Bar dataKey="Recaudado" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="Pendiente" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '16px' }}>
            Volumen por Método de Pago
          </div>
          <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value, name) => [formatCurrency(value), name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span style={{ color: '#0F172A', fontSize: '13px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No hay datos de pagos este mes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE TRANSACCIONES */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-main)'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: 'all', label: `Todas (${totalCount})` },
              { key: 'paid', label: `Pagadas (${paidCount})` },
              { key: 'pending', label: `Pendientes (${pendingCount})` }
            ].map(pill => (
              <div
                key={pill.key}
                onClick={() => setFilterStatus(pill.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: filterStatus === pill.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  border: filterStatus === pill.key ? '1px solid var(--border-main)' : '1px solid transparent',
                  background: filterStatus === pill.key ? 'var(--bg-hover)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                {pill.label}
              </div>
            ))}
          </div>
          <div style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-main)',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '250px'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar atleta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                fontFamily: 'Inter',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ margin: 0, minWidth: '900px' }}>
            <thead>
              <tr>
                <th>Atleta</th>
                <th>Grupo</th>
                <th>Concepto</th>
                <th>Método</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No se encontraron transacciones para este período
                  </td>
                </tr>
              ) : (
                transactions.map(t => {
                  const athleteName = `${t.athlete.user?.first_name || ''} ${t.athlete.user?.last_name || ''}`.trim();
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            flexShrink: 0
                          }}>
                            {getInitials(athleteName)}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{athleteName}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {t.group?.name || '-'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{t.concept}</td>
                      <td>
                        {t.status === 'pending' ? (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'var(--bg-hover)',
                            color: 'var(--text-dark)',
                            border: '1px solid var(--border-main)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            ⏳ Pendiente
                          </span>
                        ) : (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'var(--bg-hover)',
                            color: 'var(--text-dark)',
                            border: '1px solid var(--border-main)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            {getMethodIcon(t.method)} {t.method}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {formatDate(t.date)}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.9rem', textAlign: 'right' }}>
                        {formatCurrency(t.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${t.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                          {t.status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {t.status === 'pending' ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openQuickPayment(t.athlete)}
                            style={{
                              background: '#2563EB',
                              color: 'white',
                              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Registrar Pago
                          </button>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openHistory(t.athlete)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              border: '1px solid var(--border-main)',
                              cursor: 'pointer',
                              background: 'transparent',
                              color: 'var(--text-dark)'
                            }}
                          >
                            Ver Historial
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTRAR PAGO */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="">
        <div style={{ padding: 0 }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              Registrar Pago - {selectedAthlete?.user?.first_name} {selectedAthlete?.user?.last_name}
            </h3>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                background: 'var(--bg-hover)',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px 24px' }}>
              {/* Summary Box */}
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600 }}>Saldo Pendiente</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>
                    {formatCurrency(formData.amount || 0)}
                  </div>
                </div>
                <div style={{ fontSize: '2rem' }}>⏳</div>
              </div>

              <div className="form-group">
                <label className="form-label">Concepto</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                  style={{ background: 'var(--bg-hover)', cursor: 'not-allowed' }}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label">Monto a Pagar ($)</label>
                <input
                  type="text"
                  className="form-input"
                  value={new Intl.NumberFormat('es-CO').format(formData.amount || 0)}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, amount: cleaned });
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Método de Pago</label>
                <select
                  className="form-input"
                  value={formData.payment_method}
                  onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-main)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  border: '1px solid var(--border-main)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-dark)'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  border: 'none',
                  background: '#2563EB',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
                }}
              >
                Confirmar Pago
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL: HISTORIAL DE PAGOS */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="">
        <div style={{ padding: 0, maxWidth: '600px' }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              Historial de Pagos - {selectedAthlete?.user?.first_name} {selectedAthlete?.user?.last_name}
            </h3>
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              style={{
                background: 'var(--bg-hover)',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Summary */}
            <div style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-main)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Pagado (Histórico)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981' }}>
                  {formatCurrency(athleteHistory.reduce((acc, h) => acc + Number(h.amount), 0))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estado Actual</div>
                  <div style={{ fontWeight: 700, color: '#10B981' }}>Al Día</div>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Método</th>
                    <th style={{ textAlign: 'right' }}>Monto</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {athleteHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No hay pagos registrados
                      </td>
                    </tr>
                  ) : (
                    athleteHistory.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {formatDate(h.payment_date)}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{h.description}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: 'var(--bg-hover)',
                            color: 'var(--text-dark)',
                            border: '1px solid var(--border-main)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {getMethodIcon(h.payment_method)} {h.payment_method || 'Efectivo'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, textAlign: 'right' }}>
                          {formatCurrency(Number(h.amount))}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${h.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                            {h.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-main)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            <button
              className="btn btn-ghost"
              onClick={() => setIsHistoryModalOpen(false)}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 600,
                border: '1px solid var(--border-main)',
                background: 'var(--bg-surface)',
                color: 'var(--text-dark)'
              }}
            >
              Cerrar
            </button>
            <button
              className="btn btn-primary"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 600,
                border: 'none',
                background: '#0F172A',
                color: 'white'
              }}
            >
              ⬇️ Descargar Recibos
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentList;