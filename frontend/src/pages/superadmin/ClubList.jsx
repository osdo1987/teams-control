import React, { useState, useEffect, useRef } from 'react';
import clubService from '../../services/clubService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

const ClubList = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState(null);
  const [editingClub, setEditingClub] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sport: 'Fútbol',
    subscription_status: 'TRIAL',
    plan_type: 'BASIC',
    subscription_end_date: '',
    primary_color: '#6366f1',
    logo_url: '',
    welcome_message: '',
    show_features: true,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const data = await clubService.getAllClubs();
      setClubs(data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (club = null) => {
    if (club) {
      setEditingClub(club);
      setFormData({
        name: club.name,
        slug: club.slug || '',
        description: club.description || '',
        sport: club.sport || 'Fútbol',
        subscription_status: club.subscription_status || 'TRIAL',
        plan_type: club.plan_type || 'BASIC',
        subscription_end_date: club.subscription_end_date ? club.subscription_end_date.split('T')[0] : '',
        primary_color: club.primary_color || '#6366f1',
        logo_url: club.logo_url || '',
        welcome_message: club.welcome_message || '',
        show_features: club.show_features !== false,
      });
    } else {
      setEditingClub(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        sport: 'Fútbol',
        subscription_status: 'TRIAL',
        plan_type: 'BASIC',
        subscription_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        primary_color: '#6366f1',
        logo_url: '',
        welcome_message: '',
        show_features: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClub) {
        await clubService.updateClub(editingClub.id, formData);
      } else {
        await clubService.createClub(formData);
      }
      setShowModal(false);
      fetchClubs();
    } catch (error) {
      alert('Error: ' + (error.message || 'Error al procesar la solicitud'));
    }
  };

  const handleDelete = async () => {
    if (!clubToDelete) return;
    try {
      await clubService.deleteClub(clubToDelete.id);
      showSuccess('Club desactivado correctamente');
      fetchClubs();
    } catch (error) {
      showError(error.message || 'Error al desactivar el club');
    } finally {
      setIsConfirmOpen(false);
      setClubToDelete(null);
    }
  };

  const handleReactivate = async (clubId) => {
    try {
      await clubService.reactivateClub(clubId);
      showSuccess('Club reactivado correctamente');
      fetchClubs();
    } catch (error) {
      showError(error.message || 'Error al reactivar el club');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo excede el tamaño máximo de 5MB');
      e.target.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Usa PNG, JPG, GIF, WebP o SVG.');
      e.target.value = '';
      return;
    }

    setUploadingLogo(true);
    try {
      const result = await clubService.uploadLogo(file);
      setFormData({ ...formData, logo_url: result.url });
    } catch (error) {
      alert('Error al subir la imagen: ' + (error.message || 'Error desconocido'));
    } finally {
      setUploadingLogo(false);
      // Reset input so the same file can be selected again
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="badge badge-success">Activo</span>;
      case 'TRIAL': return <span className="badge badge-primary">Prueba</span>;
      case 'EXPIRED': return <span className="badge badge-danger">Vencido</span>;
      case 'INACTIVE': return <span className="badge badge-neutral">Inactivo</span>;
      default: return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const getActiveBadge = (isActive) => {
    return isActive !== false ? null : <span className="badge badge-danger" style={{ marginLeft: 6 }}>Desactivado</span>;
  };

  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'BASIC': return <span className="badge badge-info">Básico ($120.000/mes)</span>;
      default: return <span className="badge badge-neutral">{plan}</span>;
    }
  };

  if (loading) return <div className="loading-state"><span className="spinner" /><p>Cargando clubes...</p></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1>Gestión de Clubes</h1>
          <p className="text-muted">Administra los clubes registrados y sus estados de suscripción.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Nuevo Club
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Club</th>
              <th>Slug/URL</th>
              <th>Deporte</th>
              <th>Suscripción</th>
              <th>Plan</th>
              <th>Vencimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr key={club.id}>
                <td>
                  <div className="table-cell-name">
                    <div className="info">
                      <strong>{club.name}</strong>
                      <small>ID: #{club.id}</small>
                    </div>
                  </div>
                </td>
                <td>
                  {club.slug ? (
                    <a href={`/${club.slug}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--brand-600)', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}
                      title="Abrir login personalizado">
                      /{club.slug}
                    </a>
                  ) : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Sin slug</span>}
                </td>
                <td><span className="badge badge-info badge-no-dot">{club.sport}</span></td>
                <td>{getStatusBadge(club.subscription_status)}</td>
                <td>{getPlanBadge(club.plan_type)}</td>
                <td>{club.subscription_end_date ? new Date(club.subscription_end_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(club)}>Gestionar</button>
                    {club.slug && (
                      <a href={`/${club.slug}`} target="_blank" rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm" title="Ver login personalizado">
                        Ver
                      </a>
                    )}
                    {club.is_active !== false ? (
                      <button className="btn btn-sm btn-danger"
                        onClick={() => { setClubToDelete(club); setIsConfirmOpen(true); }}>Eliminar</button>
                    ) : (
                      <button className="btn btn-sm btn-success"
                        onClick={() => handleReactivate(club.id)}>Reactivar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {clubs.length === 0 && (
              <tr>
                <td colSpan="7"><div className="table-empty">No hay clubes registrados</div></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Desactivar Club"
        message={`¿Estás seguro de desactivar el club "${clubToDelete?.name}"? Los usuarios no podrán acceder hasta que sea reactivado.`}
      />

      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingClub ? "Gestionar Club y Suscripción" : "Crear Nuevo Club"}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nombre del Club</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Deporte</label>
                <select
                  className="form-input"
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                >
                  <option value="Fútbol">Fútbol</option>
                  <option value="Natación">Natación</option>
                  <option value="Baloncesto">Baloncesto</option>
                  <option value="Voleibol">Voleibol</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-soft)', margin: '8px 0' }}></div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--brand-600)', fontWeight: 700, marginBottom: '4px' }}>DATOS DE SUSCRIPCIÓN</h4>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="form-input"
                  value={formData.subscription_status}
                  onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                >
                  <option value="TRIAL">Periodo de Prueba</option>
                  <option value="ACTIVE">Activo (Pagado)</option>
                  <option value="EXPIRED">Vencido / Suspendido</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Plan</label>
                <select
                  className="form-input"
                  value={formData.plan_type}
                  onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                >
                  <option value="BASIC">Básico ($120.000/mes)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Vencimiento</label>
              <input
                type="date"
                className="form-input"
                value={formData.subscription_end_date}
                onChange={(e) => setFormData({ ...formData, subscription_end_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción Interna</label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="Notas sobre el club o su facturación..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>

            <div style={{ borderTop: '1px solid var(--border-soft)', margin: '8px 0' }}></div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--brand-600)', fontWeight: 700, marginBottom: '4px' }}>PERSONALIZACIÓN DEL LOGIN</h4>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Slug / URL del Club</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="troya-voley"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  URL amigable: /{formData.slug || 'mi-club'}
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Color Primario</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    style={{ width: '44px', height: '38px', border: '1px solid var(--border-soft)', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Logo del Club</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Image preview and upload area */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: formData.logo_url ? '8px' : '16px',
                    border: '2px dashed var(--border-soft)',
                    borderRadius: '12px',
                    background: 'var(--bg-subtle)',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Preview */}
                  {formData.logo_url && (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={formData.logo_url}
                        alt="Preview logo"
                        style={{
                          width: '72px',
                          height: '72px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: '2px solid var(--border-soft)',
                          background: '#fff',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo_url: '' })}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'var(--danger-500, #ef4444)',
                          color: '#fff',
                          border: '2px solid #fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          lineHeight: 1,
                          fontWeight: 700,
                        }}
                        title="Eliminar logo"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Upload button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/gif, image/webp, image/svg+xml"
                      style={{ display: 'none' }}
                      onChange={handleLogoUpload}
                    />
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                      >
                        {uploadingLogo ? (
                          <>
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            📁 Seleccionar imagen
                          </>
                        )}
                      </button>
                      {formData.logo_url && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                          Logo cargado
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      PNG, JPG, GIF, WebP o SVG. Máx 5MB.
                    </span>
                  </div>
                </div>

                {/* URL input as fallback */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>O ingresa una URL:</span>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://ejemplo.com/logo.png"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mensaje de Bienvenida</label>
              <input
                type="text"
                className="form-input"
                placeholder="Gestión deportiva sin fricción."
                value={formData.welcome_message}
                onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="show_features"
                checked={formData.show_features}
                onChange={(e) => setFormData({ ...formData, show_features: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: formData.primary_color }}
              />
              <label htmlFor="show_features" className="form-label" style={{ marginBottom: 0 }}>Mostrar lista de características en el login</label>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editingClub ? 'Actualizar Cambios' : 'Crear Club'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ClubList;
