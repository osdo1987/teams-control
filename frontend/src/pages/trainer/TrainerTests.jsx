import React, { useEffect, useState } from 'react';
import { testService } from '../../services/testService';
import { groupService } from '../../services/groupService';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import Modal from '../../components/UI/Modal';

const TrainerTests = () => {
    const [templates, setTemplates] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [athletes, setAthletes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({ template_id: '', athlete_id: '', value: '', test_date: new Date().toISOString().split('T')[0] });
    const { showError, showSuccess } = useToast();
    const user = authService.getCurrentUser();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadAthletes();
        }
    }, [selectedGroup]);

    const loadData = async () => {
        try {
            const [templatesData, groupsData] = await Promise.all([
                testService.getTemplates(),
                groupService.getGroups()
            ]);
            setTemplates(templatesData || []);
            const myGroups = groupsData.filter(g =>
                g.trainers?.some(t => t.id === user?.id)
            );
            setGroups(myGroups);
        } catch (err) {
            showError('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const loadAthletes = async () => {
        try {
            const data = await groupService.getGroupAthletes(selectedGroup);
            setAthletes(data || []);
        } catch (err) {
            showError('Error al cargar atletas');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await testService.createResult(createForm);
            showSuccess('Test registrado correctamente');
            setCreating(false);
            setCreateForm({ template_id: '', athlete_id: '', value: '', test_date: new Date().toISOString().split('T')[0] });
        } catch (err) {
            showError('Error al registrar test');
        }
    };

    if (loading) return <div className="loading-state"><p>Cargando...</p></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Tests Físicos</h1>
                    <p className="text-muted">Registra y administra tests físicos de los atletas</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Nuevo Test</button>
                </div>
            </div>

            {/* Select group to view athletes */}
            <div className="profile-card" style={{ marginBottom: 24 }}>
                <div className="form-group">
                    <label className="form-label">Seleccionar Grupo</label>
                    <select
                        className="form-input"
                        value={selectedGroup}
                        onChange={e => setSelectedGroup(e.target.value)}
                    >
                        <option value="">-- Seleccionar --</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedGroup && athletes.length > 0 && (
                <div className="table-card">
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Atleta</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {athletes.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            <strong>{a.user?.first_name} {a.user?.last_name}</strong>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => {
                                                    setCreateForm({
                                                        ...createForm,
                                                        athlete_id: a.id,
                                                        template_id: templates[0]?.id || ''
                                                    });
                                                    setCreating(true);
                                                }}
                                            >
                                                🧪 Registrar Test
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Crear Test */}
            <Modal isOpen={creating} onClose={() => setCreating(false)} title="Registrar Test Físico">
                <form onSubmit={handleCreate} style={{ display: 'contents' }}>
                    <div className="form-group">
                        <label className="form-label">Plantilla de Test</label>
                        <select
                            className="form-input"
                            value={createForm.template_id}
                            onChange={e => setCreateForm({ ...createForm, template_id: e.target.value })}
                            required
                        >
                            <option value="">Seleccionar</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Atleta</label>
                        <select
                            className="form-input"
                            value={createForm.athlete_id}
                            onChange={e => setCreateForm({ ...createForm, athlete_id: e.target.value })}
                            required
                        >
                            <option value="">Seleccionar</option>
                            {athletes.map(a => (
                                <option key={a.id} value={a.id}>{a.user?.first_name} {a.user?.last_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Valor</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={createForm.value}
                            onChange={e => setCreateForm({ ...createForm, value: e.target.value })}
                            required
                            placeholder="Ej: 12.5"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha</label>
                        <input
                            type="date"
                            className="form-input"
                            value={createForm.test_date}
                            onChange={e => setCreateForm({ ...createForm, test_date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Guardar Test</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TrainerTests;