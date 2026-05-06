import React from 'react';

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9','#f59e0b'];
const colorFor = (str = '') => AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length];
const initials  = (firstName, lastName) =>
  `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();

const recentAthletes = [
  { first_name: 'Carlos',   last_name: 'R.', group: 'U-18 Soccer',   status: 'Activo'   },
  { first_name: 'María',    last_name: 'P.', group: 'Vóley fem.',     status: 'Activo'   },
  { first_name: 'Juan',     last_name: 'M.', group: 'Básquet U-20',   status: 'Inactivo' },
  { first_name: 'Laura',    last_name: 'G.', group: 'U-18 Soccer',    status: 'Activo'   },
];
const pendingPayments = [
  { name: 'Carlos R.', amount: '$120.000', status: 'Pendiente' },
  { name: 'Pedro S.',  amount: '$85.000',  status: 'Vencido'   },
  { name: 'Ana T.',    amount: '$120.000', status: 'Pagado'    },
  { name: 'Luis F.',   amount: '$85.000',  status: 'Pagado'    },
];

const paymentBadge = (s) => {
  if (s === 'Pendiente') return 'badge badge-warning';
  if (s === 'Vencido')   return 'badge badge-danger';
  return 'badge badge-success';
};

const DashboardHome = () => (
  <div>
    {/* Header */}
    <div className="page-header">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted">Resumen general del club</p>
      </div>
      <button className="btn btn-primary">+ Registrar ingreso</button>
    </div>

    {/* Stat cards */}
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-icon blue">🏃</div>
        <div className="stat-value">148</div>
        <div className="stat-label">Atletas activos</div>
        <div className="stat-trend up">↑ +12 este mes</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon orange">👥</div>
        <div className="stat-value">9</div>
        <div className="stat-label">Grupos activos</div>
        <div className="stat-trend up">↑ +2 nuevos</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon green">💰</div>
        <div className="stat-value">$4.2M</div>
        <div className="stat-label">Ingresos del mes</div>
        <div className="stat-trend up">↑ +8% vs anterior</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon yellow">📊</div>
        <div className="stat-value">87%</div>
        <div className="stat-label">Asistencia promedio</div>
        <div className="stat-trend down">↓ -3% vs anterior</div>
      </div>
    </div>

    {/* Bottom tables */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

      {/* Recent Athletes */}
      <div className="card">
        <div className="card-header">
          <h3>Atletas recientes</h3>
          <a href="/admin/athletes">Ver todos</a>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Atleta</th>
              <th>Grupo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {recentAthletes.map((a, i) => (
              <tr key={i}>
                <td>
                  <div className="table-cell-name">
                    <div className="table-avatar" style={{ background: colorFor(a.first_name) }}>
                      {initials(a.first_name, a.last_name)}
                    </div>
                    <strong>{a.first_name} {a.last_name}</strong>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>{a.group}</td>
                <td>
                  <span className={a.status === 'Activo' ? 'badge badge-success' : 'badge badge-inactive'}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Payments */}
      <div className="card">
        <div className="card-header">
          <h3>Pagos pendientes</h3>
          <a href="/admin/payments">Ver todos</a>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Atleta</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pendingPayments.map((p, i) => (
              <tr key={i}>
                <td><strong>{p.name}</strong></td>
                <td style={{ fontWeight: 700 }}>{p.amount}</td>
                <td><span className={paymentBadge(p.status)}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  </div>
);

export default DashboardHome;
