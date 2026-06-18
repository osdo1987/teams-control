import React, { useEffect, useState } from 'react';
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

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ ...INITIAL_USER_FORM });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Edit profile modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [profileForm, setProfileForm] = useState({ ...INITIAL_PROFILE_FORM });
  const [activeTab, setActiveTab] = useState('personal');

  // Delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);

  useEffect(() => { fetchTrainers(); }, []);

  const fetchTrainers = async () => {
    try { // clearMessages(); // No longer needed with toast
      const data = await authService.getTrainers(); // This fetches users with role TRAINER
      setTrainers(data || []);
    } catch { setError('Error al cargar entrenadores'); }
    finally { setLoading(false); }
  };

  const filteredTrainers = trainers.filter(t => {
    const name = `${t.first_name} ${t.last_name}`.toLowerCase();
    const id = (t.identification_number || '').toString();
    return name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
  });

  // --- CREATE ---
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

  // --- EDIT PROFILE ---
  const openProfile = (trainer) => {
    setSelectedTrainer(trainer);
    const tp = trainer.trainer_profile || {};
    setProfileForm({
      birth_date: tp.birth_date || '', gender: tp.gender || '', address: tp.address || '',
      city: tp.city || '', state: tp.state || '',
      emergency_contact_name: tp.emergency_contact_name || '', emergency_contact_phone: tp.emergency_contact_phone || '',
      bank_name: tp.bank_name || '', bank_account_number: tp.bank_account_number || '',
      bank_account_type: tp.bank_account_type || '', salary: tp.salary || '',
      payment_frequency: tp.payment_frequency || '', tax_id: tp.tax_id || '',
      education_level: tp.education_level || '', institution: tp.institution || '',
      degree_title: tp.degree_title || '', graduation_year: tp.graduation_year || '',
      certifications: tp.certifications || '', specialization: tp.specialization || '',
      years_of_experience: tp.years_of_experience || '', previous_clubs: tp.previous_clubs || '',
      bio: tp.bio || '', hire_date: tp.hire_date || '', contract_type: tp.contract_type || ''
    });
    setActiveTab('personal');
    setIsProfileOpen(true);
  };

  const handleProfileChange = e => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });

  const handleProfileSubmit = async e => {
    e.preventDefault();
    try {
      const payload = { ...profileForm, role: 'TRAINER' };
      if (payload.salary) payload.salary = parseFloat(payload.salary);
      if (payload.graduation_year) payload.graduation_year = parseInt(payload.graduation_year);
      if (payload.years_of_experience) payload.years_of_experience = parseInt(payload.years_of_experience);
      await userService.updateUser(selectedTrainer.id, payload);
      setIsProfileOpen(false);
      fetchTrainers();
      showSuccess('Perfil de entrenador actualizado correctamente');
    } catch (err) { showError(err.message || 'Error al guardar perfil'); }
  };

  // --- DELETE ---
  const confirmDelete = async () => {
    if (!trainerToDelete) return;
    try {
      await userService.deleteUser(trainerToDelete.id);
      showSuccess('Entrenador eliminado correctamente');
      fetchTrainers();
    } catch (err) { showError(err.message || 'Error al eliminar entrenador'); }
    finally { setIsConfirmOpen(false); setTrainerToDelete(null); }
  };

  const tabStyle = (tab) => ({
    padding: '8px 16px', border: 'none',
    background: activeTab === tab ? 'var(--primary-color)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s'
  });

  if (loading) return <div className="loading-state"><p>Cargando entrenadores...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Entrenadores</h1>
          <p className="text-muted">Gestiona los perfiles profesionales y datos de los entrenadores.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Entrenador</button>
      </div>

      <div className="filter-row">
        <div className="search-field">
          <input type="text" placeholder="🔍 Buscar por nombre o identificación..." className="form-input"
            style={{ borderRadius: '12px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Entrenador</th>
              <th>Identificación</th>
              <th>Contacto</th>
              <th>Especialización</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrainers.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No se encontraron entrenadores</td></tr>
            ) : filteredTrainers.map(t => (
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
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                      onClick={() => { setTrainerToDelete(t); setIsConfirmOpen(true); }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {/* Modal Perfil Entrenador */}
      <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title={`Perfil de ${selectedTrainer?.first_name}`}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--bg-main)', padding: 4, borderRadius: 10 }}>
          <button type="button" style={tabStyle('personal')} onClick={() => setActiveTab('personal')}>👤 Personal</button>
          <button type="button" style={tabStyle('payment')} onClick={() => setActiveTab('payment')}>💰 Pago</button>
          <button type="button" style={tabStyle('education')} onClick={() => setActiveTab('education')}>🎓 Educación</button>
          <button type="button" style={tabStyle('experience')} onClick={() => setActiveTab('experience')}>📋 Experiencia</button>
        </div>
        <form onSubmit={handleProfileSubmit} style={{ display: 'contents' }}>
          {activeTab === 'personal' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group"><label className="form-label">Fecha Nacimiento</label><input type="date" name="birth_date" value={profileForm.birth_date} onChange={handleProfileChange} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Género</label>
                  <select name="gender" value={profileForm.gender} onChange={handleProfileChange} className="form-input">
                    <option value="">Seleccionar</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Dirección</label><input type="text" name="address" value={profileForm.address} onChange={handleProfileChange} className="form-input" placeholder="Calle 45 #12-30" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group"><label className="form-label">Ciudad</label><input type="text" name="city" value={profileForm.city} onChange={handleProfileChange} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Departamento</label><input type="text" name="state" value={profileForm.state} onChange={handleProfileChange} className="form-input" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group"><label className="form-label">Contacto Emergencia</label><input type="text" name="emergency_contact_name" value={profileForm.emergency_contact_name} onChange={handleProfileChange} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Tel. Emergencia</label><input type="text" name="emergency_contact_phone" value={profileForm.emergency_contact_phone} onChange={handleProfileChange} className="form-input" /></div>
              </div>
            </>
          )}
          {activeTab === 'payment' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group"><label className="form-label">Banco</label><input type="text" name="bank_name" value={profileForm.bank_name} onChange={handleProfileChange} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Tipo Cuenta</label>
                  <select name="bank_account_type" value={profileForm.bank_account_type} onChange={handleProfileChange} className="form-input">
                    <option value="">Seleccionar</option><option value="Ahorros">Ahorros</option><option value="Corriente">Corriente</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Número de Cuenta</label><input type="text" name="bank_account_number" value={profileForm.bank_account_number} onChange={handleProfileChange} className="form-input" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group"><label className="form-label">Salario</label><input type="number" name="salary" value={profileForm.salary} onChange={handleProfileChange} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Frecuencia Pago</label>
                  <select name="payment_frequency" value={profileForm.payment_frequency} onChange={handleProfileChange} className="form-input">
                    <option value="">Seleccionar</option><option value="Mensual">Mensual</option><option value="Quincenal">Quincenal</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Tipo Contrato</label><input type="text" name="contract_type" value={profileForm.contract_type} onChange={handleProfileChange} className="form-input" /></div>
            </>
          )}
          {activeTab === 'education' && (
            <>
              <div className="form-group"><label className="form-label">Nivel Educativo</label><input type="text" name="education_level" value={profileForm.education_level} onChange={handleProfileChange} className="form-input" /></div>
              <div className="form-group"><label className="form-label">Institución</label><input type="text" name="institution" value={profileForm.institution} onChange={handleProfileChange} className="form-input" /></div>
              <div className="form-group"><label className="form-label">Especialización Deportiva</label><input type="text" name="specialization" value={profileForm.specialization} onChange={handleProfileChange} className="form-input" /></div>
              <div className="form-group"><label className="form-label">Certificaciones</label><textarea name="certifications" value={profileForm.certifications} onChange={handleProfileChange} className="form-input" rows={3} /></div>
            </>
          )}
          {activeTab === 'experience' && (
            <>
              <div className="form-group"><label className="form-label">Años de Experiencia</label><input type="number" name="years_of_experience" value={profileForm.years_of_experience} onChange={handleProfileChange} className="form-input" /></div>
              <div className="form-group"><label className="form-label">Bio / Resumen Profesional</label><textarea name="bio" value={profileForm.bio} onChange={handleProfileChange} className="form-input" rows={5} /></div>
            </>
          )}
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsProfileOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Perfil</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Eliminar Entrenador" message={`¿Eliminar permanentemente a ${trainerToDelete?.first_name} ${trainerToDelete?.last_name}? Esta acción no se puede deshacer.`} />
    </div>
  );
};

export default TrainerList;