import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { athleteService } from '../../services/athleteService';
import { userService } from '../../services/userService';
import { groupService } from '../../services/groupService';
import { authService } from '../../services/authService';
import clubService from '../../services/clubService';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/UI/ConfirmModal';
import Modal from '../../components/UI/Modal';
import PasswordInput from '../../components/UI/PasswordInput';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first?.[0] || '?'}${last?.[0] || '?'}`.toUpperCase();

const AthleteList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [athletes, setAthletes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true); // Keep loading state
  const { showError, showSuccess } = useToast(); // Use toast for errors/success
  const [filterNoGroup, setFilterNoGroup] = useState(false);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    identification_number: '', email: '', password: '', first_name: '', last_name: '',
    phone: '', birth_date: '', address: '', group_id: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [createClubId, setCreateClubId] = useState('');

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);
  const [editForm, setEditForm] = useState({ birth_date: '', phone: '', address: '', group_id: '' });

  // Delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);

  const openCreate = (defaultGroupId = '') => {
    setCreateForm({
      identification_number: '', email: '', password: '', first_name: '', last_name: '',
      phone: '', birth_date: '', address: '', group_id: defaultGroupId || ''
    });
    setConfirmPassword('');
    setPasswordError('');
    setIsCreateOpen(true);
  };

  useEffect(() => {
    const init = async () => {
      await fetchAll();
    };
    init();
  }, []);

  useEffect(() => {
    const openParam = searchParams.get('openCreate');
    const groupParam = searchParams.get('group_id');
    if (openParam === 'true' && !loading) {
      openCreate(groupParam);
    }
  }, [searchParams, loading]);

  const fetchAll = async () => {
    // clearMessages(); // No longer needed with toast
    try {
      const [athletesData, groupsData, clubsData] = await Promise.all([
        athleteService.getAthletes(),
        groupService.getGroups(),
        clubService.getAllClubs()
      ]);
      setAthletes(athletesData || []);
      setGroups(groupsData || []);
      setClubs(clubsData || []);
    } catch (err) { showError(err.message || 'Error al cargar datos'); }
    finally { setLoading(false); }
  };

  const currentUser = authService.getCurrentUser();
  const clubGroups = groups.filter(g => parseInt(g.club_id) === parseInt(currentUser?.club_id));

  const filteredAthletes = athletes.filter(a => {
    const name = `${a.user?.first_name} ${a.user?.last_name}`.toLowerCase();
    const id = (a.user?.identification_number || '').toString();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
    if (!matchesSearch) return false;
    if (filterNoGroup) {
      return !a.current_groups || a.current_groups.length === 0;
    }
    return true;
  });

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
        identification_number: createForm.identification_number,
        email: createForm.email,
        password: createForm.password,
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        role: 'ATHLETE',
        club_id: currentUser?.club_id,
        group_id: createForm.group_id ? parseInt(createForm.group_id) : null,
        phone: createForm.phone
      };
      await userService.createUser(payload);
      setIsCreateOpen(false);
      fetchAll();
      showSuccess('Atleta creado correctamente');
    } catch (err) { showError(err.message || 'Error al crear atleta'); }
  };

  // --- EDIT ---
  const openEdit = (athlete) => {
    setEditingAthlete(athlete);
    setEditForm({
      birth_date: athlete.birth_date ? athlete.birth_date.split('T')[0] : '',
      phone: athlete.phone || '',
      address: athlete.address || '',
      group_id: athlete.current_groups?.[0]?.id || ''
    });
    setIsEditOpen(true);
  };

  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleEditSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        athlete: {
          birth_date: editForm.birth_date,
          phone: editForm.phone,
          address: editForm.address
        },
        group_id: editForm.group_id ? parseInt(editForm.group_id) : null
      };
      await athleteService.updateAthlete(editingAthlete.id, payload);
      setIsEditOpen(false);
      fetchAll();
      showSuccess('Atleta actualizado correctamente');
    } catch (err) { showError(err.message || 'Error al guardar cambios'); }
  };

  // --- DELETE ---
  const confirmDelete = async () => {
    if (!athleteToDelete) return;
    try {
      await athleteService.deleteAthlete(athleteToDelete.id);
      showSuccess('Atleta eliminado correctamente');
      fetchAll();
    } catch (err) { showError(err.message || 'Error al eliminar atleta'); }
    finally { setIsConfirmOpen(false); setAthleteToDelete(null); }
  };

  if (loading) return <div className="loading-state"><p>Cargando atletas...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Atletas</h1>
          <p className="text-muted">Gestión de atletas, transferencias y hoja de vida deportiva.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Atleta</button>
      </div>

      <div className="filter-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-field" style={{ flex: 1, minWidth: '280px' }}>
          <input type="text" placeholder="🔍 Buscar por nombre o identificación..." className="form-input"
            style={{ borderRadius: '12px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${!filterNoGroup ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '12px', padding: '8px 16px' }}
            onClick={() => setFilterNoGroup(false)}
          >
            Todos ({athletes.length})
          </button>
          <button
            className={`btn ${filterNoGroup ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setFilterNoGroup(true)}
          >
            Sin Grupo
            <span style={{
              background: '#ef4444',
              color: 'white',
              borderRadius: '20px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {athletes.filter(a => !a.current_groups || a.current_groups.length === 0).length}
            </span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Atleta</th>
              <th>Identificación</th>
              <th>Contacto</th>
              <th>Grupo Actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAthletes.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No se encontraron atletas</td></tr>
            ) : filteredAthletes.map(a => (
              <tr key={a.id}>
                <td>
                  <div className="table-cell-name">
                    <div className="table-avatar" style={{
                      background: avatarColor(a.user?.first_name || 'A'), width: '40px', height: '40px',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: '600', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>{initials(a.user?.first_name, a.user?.last_name)}</div>
                    <div>
                      <strong>{a.user?.first_name} {a.user?.last_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{a.user?.email || 'Sin email'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{a.user?.identification_number}</td>
                <td style={{ fontSize: '0.85rem' }}>📞 {a.phone || '—'}</td>
                <td>
                  {a.current_groups && a.current_groups.length > 0 ? (
                    a.current_groups.map(g => (
                      <span key={g.id} className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                        {g.name}
                        <button
                          style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0 2px', fontSize: '0.75rem', fontWeight: 'bold' }}
                          onClick={async () => {
                            if (window.confirm(`¿Remover a ${a.user?.first_name} del grupo ${g.name}?`)) {
                              try {
                                await athleteService.updateAthlete(a.id, {
                                  athlete: { birth_date: a.birth_date, phone: a.phone, address: a.address },
                                  group_id: null
                                });
                                fetchAll();
                              } catch (err) {
                                showError(err.message || 'Error al remover del grupo');
                              }
                            }
                          }}
                          title="Remover del grupo"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    <select
                      className="form-input"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', height: 'auto', width: 'auto', minWidth: '130px', borderRadius: '8px', border: '1px solid #ef4444' }}
                      value=""
                      onChange={async (e) => {
                        const groupId = e.target.value;
                        if (!groupId) return;
                        try {
                          await athleteService.updateAthlete(a.id, {
                            athlete: { birth_date: a.birth_date, phone: a.phone, address: a.address },
                            group_id: parseInt(groupId)
                          });
                          fetchAll();
                        } catch (err) {
                          showError(err.message || 'Error al asignar grupo');
                        }
                      }}
                    >
                      <option value="">⚠️ Asignar grupo...</option>
                      {clubGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/athletes/${a.id}`)}>👁 Ver</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>✏️ Editar</button>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                      onClick={() => { setAthleteToDelete(a); setIsConfirmOpen(true); }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Atleta */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Atleta">
        <form onSubmit={handleCreateSubmit} style={{ display: 'contents' }}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nombres *</label>
              <input type="text" name="first_name" value={createForm.first_name} onChange={handleCreateChange} className="form-input" required placeholder="Laura" />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos *</label>
              <input type="text" name="last_name" value={createForm.last_name} onChange={handleCreateChange} className="form-input" required placeholder="Ospina" />
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
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Fecha de Nacimiento</label>
              <input type="date" name="birth_date" value={createForm.birth_date} onChange={handleCreateChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input type="text" name="phone" value={createForm.phone} onChange={handleCreateChange} className="form-input" placeholder="3001234567" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input type="text" name="address" value={createForm.address} onChange={handleCreateChange} className="form-input" placeholder="Carrera 45 #12-30" />
          </div>
          <div className="form-group">
            <label className="form-label">Asignar a Grupo</label>
            <select name="group_id" value={createForm.group_id} onChange={handleCreateChange} className="form-input">
              <option value="">Seleccionar Grupo</option>
              {clubGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.category})</option>)}
            </select>
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
            <button type="submit" className="btn btn-primary">Crear Atleta</button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Atleta */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Editar ${editingAthlete?.user?.first_name}`}>
        <form onSubmit={handleEditSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Fecha de Nacimiento</label>
            <input type="date" name="birth_date" value={editForm.birth_date} onChange={handleEditChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="text" name="phone" value={editForm.phone} onChange={handleEditChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input type="text" name="address" value={editForm.address} onChange={handleEditChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Transferir a Grupo</label>
            <select name="group_id" value={editForm.group_id} onChange={handleEditChange} className="form-input">
              <option value="">-- Sin Grupo / Remover --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsEditOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Eliminar Atleta" message={`¿Eliminar permanentemente a ${athleteToDelete?.user?.first_name} ${athleteToDelete?.user?.last_name}? Esta acción no se puede deshacer.`} />
    </div>
  );
};

export default AthleteList;