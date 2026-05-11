import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import Modal from '../../components/UI/Modal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];

const INITIAL_PROFILE_FORM = {
  // Trainer profile fields
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_PROFILE_FORM });
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => { fetchTrainers(); }, []);

  const fetchTrainers = async () => {
    try {
      const data = await authService.getTrainers();
      setTrainers(data || []);
    } catch { setError('Error al cargar entrenadores'); }
    finally { setLoading(false); }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openProfileModal = (trainer) => {
    setSelectedTrainer(trainer);
    const tp = trainer.trainer_profile || {};
    setFormData({
      birth_date: tp.birth_date || '',
      gender: tp.gender || '',
      address: tp.address || '',
      city: tp.city || '',
      state: tp.state || '',
      emergency_contact_name: tp.emergency_contact_name || '',
      emergency_contact_phone: tp.emergency_contact_phone || '',
      bank_name: tp.bank_name || '',
      bank_account_number: tp.bank_account_number || '',
      bank_account_type: tp.bank_account_type || '',
      salary: tp.salary || '',
      payment_frequency: tp.payment_frequency || '',
      tax_id: tp.tax_id || '',
      education_level: tp.education_level || '',
      institution: tp.institution || '',
      degree_title: tp.degree_title || '',
      graduation_year: tp.graduation_year || '',
      certifications: tp.certifications || '',
      specialization: tp.specialization || '',
      years_of_experience: tp.years_of_experience || '',
      previous_clubs: tp.previous_clubs || '',
      bio: tp.bio || '',
      hire_date: tp.hire_date || '',
      contract_type: tp.contract_type || ''
    });
    setActiveTab('personal');
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        role: 'TRAINER' // Keep role consistent
      };
      if (payload.salary) payload.salary = parseFloat(payload.salary);
      if (payload.graduation_year) payload.graduation_year = parseInt(payload.graduation_year);
      if (payload.years_of_experience) payload.years_of_experience = parseInt(payload.years_of_experience);

      await userService.updateUser(selectedTrainer.id, payload);
      setIsModalOpen(false);
      fetchTrainers();
    } catch (err) { setError(err.message || 'Error al guardar perfil'); }
  };

  const tabStyle = (tab) => ({
    padding: '8px 16px',
    border: 'none',
    background: activeTab === tab ? 'var(--primary-color)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
    transition: 'all 0.2s'
  });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando entrenadores...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Entrenadores</h1>
          <p className="text-muted">Gestiona los perfiles profesionales y datos de los entrenadores.</p>
        </div>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {trainers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', gridColumn: '1/-1', padding: '40px' }}>No hay entrenadores registrados. Créalos primero en la sección de Usuarios.</p>
        ) : trainers.map(trainer => (
          <div key={trainer.id} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ 
                width: 50, height: 50, borderRadius: 14, 
                background: avatarColor(trainer.first_name), 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.2rem', fontWeight: 700
              }}>
                {trainer.first_name[0]}{trainer.last_name[0]}
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{trainer.first_name} {trainer.last_name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>ID: {trainer.identification_number}</p>
              </div>
            </div>
            
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              <div>📧 {trainer.email || 'Sin email'}</div>
              <div>📞 {trainer.phone || 'Sin teléfono'}</div>
              <div style={{ marginTop: 8 }}>
                <strong>Especialidad:</strong> {trainer.trainer_profile?.specialization || 'No definida'}
              </div>
            </div>

            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => openProfileModal(trainer)}>
              Gestionar Perfil Completo
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Perfil de ${selectedTrainer?.first_name}`}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--bg-main)', padding: 4, borderRadius: 10 }}>
          <button type="button" style={tabStyle('personal')} onClick={() => setActiveTab('personal')}>👤 Personal</button>
          <button type="button" style={tabStyle('payment')} onClick={() => setActiveTab('payment')}>💰 Pago</button>
          <button type="button" style={tabStyle('education')} onClick={() => setActiveTab('education')}>🎓 Educación</button>
          <button type="button" style={tabStyle('experience')} onClick={() => setActiveTab('experience')}>📋 Experiencia</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          {activeTab === 'personal' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Fecha de Nacimiento</label>
                  <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Género</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="form-input">
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="form-input" placeholder="Calle 45 #12-30" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Ciudad</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="form-input" placeholder="Bogotá" />
                </div>
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="form-input" placeholder="Cundinamarca" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Contacto Emergencia</label>
                  <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tel. Emergencia</label>
                  <input type="text" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleInputChange} className="form-input" />
                </div>
              </div>
            </>
          )}

          {activeTab === 'payment' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Banco</label>
                  <input type="text" name="bank_name" value={formData.bank_name} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo Cuenta</label>
                  <select name="bank_account_type" value={formData.bank_account_type} onChange={handleInputChange} className="form-input">
                    <option value="">Seleccionar</option>
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Número de Cuenta</label>
                <input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} className="form-input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Salario</label>
                  <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Frecuencia Pago</label>
                  <select name="payment_frequency" value={formData.payment_frequency} onChange={handleInputChange} className="form-input">
                    <option value="">Seleccionar</option>
                    <option value="Mensual">Mensual</option>
                    <option value="Quincenal">Quincenal</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo Contrato</label>
                <input type="text" name="contract_type" value={formData.contract_type} onChange={handleInputChange} className="form-input" />
              </div>
            </>
          )}

          {activeTab === 'education' && (
            <>
              <div className="form-group">
                <label className="form-label">Nivel Educativo</label>
                <input type="text" name="education_level" value={formData.education_level} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Institución</label>
                <input type="text" name="institution" value={formData.institution} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Especialización Deportiva</label>
                <input type="text" name="specialization" value={formData.specialization} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Certificaciones</label>
                <textarea name="certifications" value={formData.certifications} onChange={handleInputChange} className="form-input" rows={3} />
              </div>
            </>
          )}

          {activeTab === 'experience' && (
            <>
              <div className="form-group">
                <label className="form-label">Años de Experiencia</label>
                <input type="number" name="years_of_experience" value={formData.years_of_experience} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Bio / Resumen Profesional</label>
                <textarea name="bio" value={formData.bio} onChange={handleInputChange} className="form-input" rows={5} />
              </div>
            </>
          )}

          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Perfil</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TrainerList;
