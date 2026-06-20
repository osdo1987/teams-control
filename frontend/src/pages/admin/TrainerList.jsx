import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import Modal from '../../components/UI/Modal';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/UI/ConfirmModal';
import PasswordInput from '../../components/UI/PasswordInput';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (f = '?', l = '?') => `${f?.[0] || '?'}${l?.[0] || '?'}`.toUpperCase();

const INITIAL_USER_FORM = {
  identification_number: '', email: '', password: '', first_name: '', last_name: '', phone: ''
};
const INITIAL_PROFILE_FORM = {
  birth_date: '', gender: '', address: '', city: '', state: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  bank_name: '', bank_account_number: '', bank_account_type: '', salary: '',
  payment_frequency: '', tax_id: '',
  education_level: '', institution: '', degree_title: '', graduation_year: '',
  certifications: '', specialization: '',
  years_of_experience: '', previous_clubs: '', bio: '',
  hire_date: '', contract_type: ''
};

const TrainerList = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showError, showSuccess } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ ...INITIAL_USER_FORM });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);

  useEffect(() => { fetchTrainers(); }, []);

  const fetchTrainers = async () => {
    try {
      const data = await authService.getTrainers();
      setTrainers(data || []);
    } catch { setError('Error al cargar entrenadores'); }
    finally { setLoading(false); }
  };

  const filteredTrainers = trainers.filter(t => {
    const name = `${t.first_name} ${t.last_name}`.toLowerCase();
    const id = (t.identification_number || '').toString();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
    if (!matchesSearch) return false;
    if (filterStatus === 'active') return t.is_active !== false;
    if (filterStatus === 'inactive') return t.is_active === false;
    return true;
  });

  const totalActive = trainers.filter(t => t.is_active !== false).length;
  const totalInactive = trainers.filter(t => t.is_active === false).length;

  // Pagination
  const totalPages = Math.ceil(filteredTrainers.length / ITEMS_PER_PAGE);
  const paginatedTrainers = filteredTrainers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openCreate = () => {
    setCreateForm({ ...INITIAL_USER_FORM });
    setConfirmPassword('');
    setPasswordError('');
    setIsCreateOpen(true);
  };

  const handleCreateChange = e => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
    setPasswordError('');
  };

  const validatePassword = (pass) => {
    const errors = [];
    if (pass.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(pass) && !/[a-z]/.test(pass)) errors.push('Debe contener letras');
    if (!/[0-9]/.test(pass)) errors.push('Al menos un número');
    return errors;
  };

  const handleCreateSubmit = async e => {
    e.preventDefault();
    setPasswordError('');
    if (createForm.password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    const pwdErrors = validatePassword(createForm.password);
    if (pwdErrors.length > 0) {
      showError(pwdErrors.join('. '));
      return;
    }
    try {
      const payload = {
        ...createForm,
        role: 'TRAINER',
        club_id: authService.getCurrentUser()?.club_id
      };
      await userService.createUser(payload);
      setIsCreateOpen(false);
      fetchTrainers();
      showSuccess('Entrenador creado correctamente');
    } catch (err) { showError(err.message || 'Error al crear entrenador'); }
  };

  const navigate = useNavigate();

  const openProfile = (trainer) => {
    navigate(`/admin/trainers/${trainer.id}`);
  };

  const confirmDelete = async () => {
    if (!trainerToDelete) return;
    try {
      await userService.deleteUser(trainerToDelete.id);
      showSuccess('Entrenador desactivado correctamente');
      fetchTrainers();
    } catch (err) { showError(err.message || 'Error al desactivar entrenador'); }
    finally { setIsConfirmOpen(false); setTrainerToDelete(null); }
  };

  if (loading) return <div className="loading-state"><p>Cargando entrenadores...</p></div>;

  return (
    <div className="athlete-list-page">
      {/* Header */}
      <div className="header">
        <div>
          <h1>Entrenadores</h1>
          <p>Gestiona los perfiles profesionales y datos de los entrenadores.</p>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            🔍 <input type="text" placeholder="Buscar por nombre o identificación..."
              value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
          <button className="btn-primary" onClick={openCreate}>+ Nuevo Entrenador</button>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="kpi-mini-grid">
        <div className="mini-kpi">
          <div>
            <h3>Total Entrenadores</h3>
            <div className="val">{trainers.length}</div>
          </div>
          <div className="mini-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>👥</div>
        </div>
        <div className="mini-kpi">
          <div>
            <h3>Activos</h3>
            <div className="val">{totalActive}</div>
          </div>
          <div className="mini-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>🟢</div>
        </div>
        <div className="mini-kpi">
          <div>
            <h3>Inactivos</h3>
            <div className="val">{totalInactive}</div>
          </div>
          <div className="mini-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>🔴</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-filters">
          <div className="filter-pills">
            <div className={`filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}>
              Todos ({trainers.length})
            </div>
            <div className={`filter-pill ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('active'); setCurrentPage(1); }}>
              Activos ({totalActive})
            </div>
            <div className={`filter-pill ${filterStatus === 'inactive' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('inactive'); setCurrentPage(1); }}>
              Inactivos ({totalInactive})
            </div>
          </div>
          <div className="sort-info">
            Ordenar por: <span className="sort-value">Nombre A-Z ↓</span>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Entrenador</th>
                <th>Identificación</th>
                <th>Contacto</th>
                <th>Especialización</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrainers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-cell">No se encontraron entrenadores</td>
                </tr>
              ) : paginatedTrainers.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="table-cell-name">
                      <div className="table-avatar" style={{
                        background: avatarColor(t.first_name || 'E'), width: '40px', height: '40px',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: '600', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>{initials(t.first_name, t.last_name)}</div>
                      <div>
                        <strong>{t.first_name} {t.last_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>#{t.id} · {t.email || 'Sin email'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.identification_number}</td>
                  <td style={{ fontSize: '0.85rem' }}>📞 {t.phone || '—'}</td>
                  <td><span className="badge badge-primary">{t.trainer_profile?.specialization || 'No definida'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openProfile(t)}>📋 Perfil</button>
                      {t.is_active !== false ? (
                        <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                          onClick={() => { setTrainerToDelete(t); setIsConfirmOpen(true); }}>✕</button>
                      ) : (
                        <button className="btn btn-sm btn-success"
                          onClick={async () => {
                            try {
                              await userService.reactivateUser(t.id);
                              showSuccess('Entrenador reactivado correctamente');
                              fetchTrainers();
                            } catch (err) { showError(err.message || 'Error al reactivar entrenador'); }
                          }}>Reactivar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredTrainers.length > ITEMS_PER_PAGE && (
          <div className="pagination">
            <span>Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTrainers.length)} de {filteredTrainers.length} resultados</span>
            <div className="pagination-buttons">
              <button className="action-btn" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}>←</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page}
                  className={`action-btn ${page === currentPage ? 'active-page' : ''}`}
                  onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
              <button className="action-btn" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}>→</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Entrenador */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Entrenador">
        <form onSubmit={handleCreateSubmit} style={{ display: 'contents' }}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nombres *</label>
              <input type="text" name="first_name" value={createForm.first_name} onChange={handleCreateChange} className="form-input" required placeholder="Carlos" />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos *</label>
              <input type="text" name="last_name" value={createForm.last_name} onChange={handleCreateChange} className="form-input" required placeholder="Mendoza" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Identificación *</label>
            <input type="text" name="identification_number" value={createForm.identification_number} onChange={handleCreateChange} className="form-input" required placeholder="1234567890" />
          </div>
          <div className="form-group">
            <label className="form-label">Email (Opcional)</label>
            <input type="email" name="email" value={createForm.email} onChange={handleCreateChange} className="form-input" placeholder="email@ejemplo.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="text" name="phone" value={createForm.phone} onChange={handleCreateChange} className="form-input" placeholder="3001234567" />
          </div>
          <PasswordInput value={createForm.password} onChange={handleCreateChange} name="password" required showStrength label="Contraseña *" />
          <div className="form-group">
            <label className="form-label">Confirmar Contraseña *</label>
            <input type="password" name="confirmPassword" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
              className="form-input" required placeholder="••••••••" minLength={6} />
          </div>
          {passwordError && <div className="badge badge-danger" style={{ marginBottom: '8px', padding: '10px 16px', borderRadius: '10px', display: 'block', fontSize: '0.8rem' }}>{passwordError}</div>}
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Crear Entrenador</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Desactivar Entrenador" message={`¿Desactivar a ${trainerToDelete?.first_name} ${trainerToDelete?.last_name}? No podrá iniciar sesión hasta que sea reactivado.`} />
    </div>
  );
};

export default TrainerList;