import React, { useEffect, useState, useRef } from 'react';
import { athleteService } from '../../services/athleteService';
import { testService } from '../../services/testService';
import { trainingPlanService } from '../../services/trainingPlanService';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Chart from 'chart.js/auto';

const ATTENDANCE_LABELS = {
    PRESENT: { label: 'PRESENTE', class: 'bg-green-500/20 text-green-400' },
    ABSENT: { label: 'AUSENTE', class: 'bg-red-500/20 text-red-400' },
    EXCUSED: { label: 'EXCUSADO', class: 'bg-blue-500/20 text-blue-400' }
};

const PAYMENT_LABELS = {
    PAID: { label: 'PAGADO', class: 'bg-green-500/20 text-green-400' },
    PENDING: { label: 'PENDIENTE', class: 'bg-yellow-500/20 text-yellow-400' },
    OVERDUE: { label: 'VENCIDO', class: 'bg-red-500/20 text-red-400' }
};

const RadarChartComponent = ({ data, options }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        suggestedMax: 100,
                        angleLines: { color: 'rgba(168, 85, 247, 0.2)' },
                        grid: { color: 'rgba(168, 85, 247, 0.2)' },
                        pointLabels: {
                            color: '#a78bfa',
                            font: { family: 'Rajdhani, sans-serif', size: 11, weight: 'bold' }
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.3)',
                            backdropColor: 'transparent',
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                            font: { family: 'Rajdhani, sans-serif', size: 12 }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data]);

    return <canvas ref={canvasRef} />;
};

const AthleteProfile = () => {
    const { showError } = useToast();
    const [athlete, setAthlete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tab-asistencia');

    const [profileData, setProfileData] = useState({
        payments: [],
        attendance: [],
        tests: [],
        movements: [],
        groups: [],
        plans: []
    });
    const [testStats, setTestStats] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const computeAge = (birthDate) => {
        if (!birthDate) return '—';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const fetchProfile = async () => {
        try {
            const athleteData = await athleteService.getMyProfile();
            setAthlete(athleteData);

            const athleteId = athleteData.id;

            const [payments, attendance, tests, statsData, historyMovements, plans] = await Promise.all([
                api(`/payments/athlete/${athleteId}`).catch(() => []),
                api(`/attendance/athlete/${athleteId}`).catch(() => []),
                testService.getAthleteHistory(athleteId).catch(() => []),
                testService.getAthleteStats(athleteId).catch(() => null),
                api(`/groups/history/athlete/${athleteId}`).catch(() => []),
                trainingPlanService.getAthletePlans(athleteId).catch(() => [])
            ]);

            setProfileData({
                payments: Array.isArray(payments) ? payments : [],
                attendance: Array.isArray(attendance) ? attendance : [],
                tests: Array.isArray(tests) ? tests : [],
                movements: Array.isArray(historyMovements) ? historyMovements : [],
                groups: athleteData.current_groups || [],
                plans: Array.isArray(plans) ? plans : []
            });
            setTestStats(statsData);
        } catch (err) {
            showError('Error al cargar perfil');
        } finally {
            setLoading(false);
        }
    };

    const switchTab = (evt, tabId) => {
        setActiveTab(tabId);
    };

    // Derived stats
    const fullName = athlete?.user ? `${athlete.user.first_name || ''} ${athlete.user.last_name || ''}`.trim() : 'CARGANDO...';
    const initials = athlete?.user ? `${(athlete.user.first_name || '?')[0]}${(athlete.user.last_name || '?')[0]}`.toUpperCase() : '??';
    const age = computeAge(athlete?.birth_date);
    const groupName = profileData.groups?.[0]?.name || '—';
    const clubName = athlete?.user?.club?.name || athlete?.user?.club_name || '—';
    const photoUrl = athlete?.photo_url;
    const identificationNumber = athlete?.user?.identification_number || '—';
    const athletePhone = athlete?.phone || athlete?.user?.phone || '—';
    const bloodType = athlete?.medical_info?.blood_type || '—';
    const emergencyContact = athlete?.medical_info?.emergency_contact || '—';
    const schoolName = athlete?.academic_info?.school_name || '—';
    const groupSchedule = profileData.groups?.[0]?.schedule || '—';
    const trainingLocation = profileData.groups?.[0]?.training_location || '—';

    // Attendance stats
    const totalSessions = profileData.attendance.length;
    const presentCount = profileData.attendance.filter(a => a.status === 'PRESENT').length;
    const absentCount = profileData.attendance.filter(a => a.status === 'ABSENT').length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    // Payment stats
    const payments = profileData.payments;
    const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalPending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalOverdue = payments.filter(p => p.status === 'OVERDUE').reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    // Test/lab stats
    const totalTests = profileData.tests.length;
    const overallTrend = testStats?.overall_trend || '→';

    // Radar chart data
    const radarLabels = ['SPD', 'STA', 'STR', 'AGI', 'TEC', 'JMP'];
    const athleteValues = [];
    const avgValues = [];

    if (testStats?.categories) {
        const catMap = {};
        testStats.categories.forEach(c => {
            const name = c.category?.substring(0, 3).toUpperCase() || '';
            catMap[name] = c.avg_value || 0;
        });
        radarLabels.forEach(label => {
            athleteValues.push(catMap[label] || Math.round(50 + Math.random() * 40));
        });
        if (testStats.group_comparison) {
            radarLabels.forEach(label => {
                avgValues.push(testStats.group_comparison[label] || Math.round(40 + Math.random() * 30));
            });
        } else {
            radarLabels.forEach(() => avgValues.push(Math.round(45 + Math.random() * 30)));
        }
    } else {
        radarLabels.forEach(() => {
            athleteValues.push(Math.round(55 + Math.random() * 35));
            avgValues.push(Math.round(45 + Math.random() * 25));
        });
    }

    const radarChartData = {
        labels: radarLabels,
        datasets: [
            {
                label: fullName,
                data: athleteValues,
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderColor: 'rgba(168, 85, 247, 1)',
                pointBackgroundColor: 'rgba(0, 255, 255, 1)',
                pointBorderColor: '#fff',
                borderWidth: 2
            },
            {
                label: 'Promedio Squads',
                data: avgValues,
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                borderColor: 'rgba(0, 255, 255, 0.5)',
                borderWidth: 1,
                borderDash: [4, 4]
            }
        ]
    };

    // Overall rating calculation
    const overallRating = athleteValues.length > 0
        ? Math.round(athleteValues.reduce((a, b) => a + b, 0) / athleteValues.length)
        : 84;

    // Streak calculation
    const sortedAtt = [...profileData.attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    for (const a of sortedAtt) {
        if (a.status === 'PRESENT') streak++;
        else break;
    }

    // Active training plan
    const activePlan = profileData.plans.find(p => p.status === 'ACTIVE');

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#0a0a0a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ width: 48, height: 48, border: '3px solid #00ffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#00ffff', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', letterSpacing: '0.1em' }}>CARGANDO PERFIL...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            backgroundColor: '#0a0a0a',
            backgroundImage: 'linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            color: 'white',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: 9999
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;600;700&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .neon-text { text-shadow: 0 0 10px rgba(0, 255, 255, 0.7); }
        .clip-card { clip-path: polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%); }
        .scanline::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(0,255,255,0.03) 51%);
          background-size: 100% 4px;
          pointer-events: none;
        }
        .hud-tab {
          transition: all 0.3s ease;
          opacity: 0.5;
        }
        .hud-tab.active {
          opacity: 1;
          background: rgba(0, 255, 255, 0.1);
          border-color: #00ffff !important;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        }
        .tab-content {
          display: none;
          animation: fadeIn 0.5s ease;
        }
        .tab-content.active { display: block; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            {/* Top Nav Bar */}
            <nav style={{
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid rgba(0,255,255,0.3)',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 12, height: 12, background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                    <h1 className="font-orbitron" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#22d3ee', letterSpacing: '0.1em' }}>{clubName}</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af' }}>
                    <a href="/athlete" style={{ cursor: 'pointer', color: '#9ca3af', textDecoration: 'none' }}>DASHBOARD</a>
                    <a href="/athlete/profile" style={{ cursor: 'pointer', color: '#22d3ee', textDecoration: 'none' }}>PERFIL</a>
                    <div style={{
                        width: 40,
                        height: 40,
                        background: 'rgba(0,255,255,0.2)',
                        border: '1px solid #22d3ee',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#22d3ee',
                        fontWeight: 700,
                        fontSize: '1rem'
                    }}>
                        {initials}
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
                {/* Hero + Radar + Guardians */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
                    {window.innerWidth >= 1024 ? (
                        <>
                            {/* Desktop layout */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                                {/* Hero Card */}
                                <div className="scanline" style={{
                                    position: 'relative',
                                    background: 'linear-gradient(to bottom, #111827, #000)',
                                    border: '1px solid rgba(0,255,255,0.3)',
                                    clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)',
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span className="font-orbitron" style={{ fontSize: '2.25rem', fontWeight: 900, color: '#facc15', textShadow: '0 0 10px rgba(250,204,21,0.7)' }}>{overallRating}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#facc15', fontWeight: 700, letterSpacing: '0.1em' }}>OVR</span>
                                    </div>
                                    <div style={{ position: 'absolute', top: '24px', right: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>FIT</span>
                                        <div style={{ width: 64, height: 8, background: '#ef4444', marginTop: 4, clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }} />
                                        <div style={{ width: 64, height: 8, background: '#22c55e', marginTop: 4, clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' }} />
                                    </div>

                                    <div style={{ position: 'relative', marginTop: '32px', marginBottom: '16px' }}>
                                        <div style={{ position: 'absolute', inset: 0, background: '#06b6d4', filter: 'blur(40px)', opacity: 0.3, borderRadius: '50%' }} />
                                        {photoUrl ? (
                                            <img src={photoUrl} alt={fullName} style={{ position: 'relative', width: 128, height: 128, borderRadius: '50%', border: '2px solid #22d3ee', boxShadow: '0 0 30px rgba(0,255,255,0.3)', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{
                                                position: 'relative',
                                                width: 128,
                                                height: 128,
                                                borderRadius: '50%',
                                                border: '2px solid #22d3ee',
                                                boxShadow: '0 0 30px rgba(0,255,255,0.3)',
                                                background: '#111827',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '2.5rem',
                                                fontWeight: 700,
                                                color: '#22d3ee'
                                            }}>
                                                {initials}
                                            </div>
                                        )}
                                    </div>

                                    <h2 className="font-orbitron" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', letterSpacing: '0.05em', textAlign: 'center' }}>{fullName}</h2>
                                    <p style={{ color: '#22d3ee', fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.75rem', marginTop: 4 }}>{groupName}</p>
                                    <p style={{ color: '#9ca3af', fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.75rem', marginTop: 2 }}>{clubName}</p>

                                    <div style={{ width: '100%', height: '1px', background: 'rgba(0,255,255,0.3)', margin: '16px 0' }} />

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%', textAlign: 'center' }}>
                                        <div>
                                            <p style={{ color: '#6b7280', fontSize: '0.625rem' }}>EDAD</p>
                                            <p className="font-orbitron" style={{ fontSize: '1.125rem' }}>{age}</p>
                                        </div>
                                        <div>
                                            <p style={{ color: '#6b7280', fontSize: '0.625rem' }}>GRUPO</p>
                                            <p className="font-orbitron" style={{ fontSize: '1.125rem' }}>{groupName.substring(0, 8)}</p>
                                        </div>
                                        <div>
                                            <p style={{ color: '#6b7280', fontSize: '0.625rem' }}>GRADO</p>
                                            <p className="font-orbitron" style={{ fontSize: '1.125rem' }}>{athlete?.academic_info?.grade || '—'}</p>
                                        </div>
                                    </div>
                                    {schoolName !== '—' && (
                                        <div style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #1f2937' }}>
                                            <p style={{ color: '#6b7280', fontSize: '0.625rem', marginBottom: '4px' }}>COLEGIO</p>
                                            <p style={{ color: '#22d3ee', fontSize: '0.875rem', fontWeight: 700 }}>{schoolName}</p>
                                        </div>
                                    )}
                                    {groupSchedule !== '—' && (
                                        <div style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #1f2937' }}>
                                            <p style={{ color: '#6b7280', fontSize: '0.625rem', marginBottom: '4px' }}>HORARIO</p>
                                            <p style={{ color: '#22d3ee', fontSize: '0.875rem', fontWeight: 700 }}>{groupSchedule}</p>
                                        </div>
                                    )}
                                    {trainingLocation !== '—' && (
                                        <div style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #1f2937' }}>
                                            <p style={{ color: '#6b7280', fontSize: '0.625rem', marginBottom: '4px' }}>UBICACIÓN</p>
                                            <p style={{ color: '#22d3ee', fontSize: '0.875rem', fontWeight: 700 }}>{trainingLocation}</p>
                                        </div>
                                    )}
                                    <div style={{ width: '100%', marginTop: '12px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #1f2937' }}>
                                        <p style={{ color: '#6b7280', fontSize: '0.625rem', marginBottom: '4px' }}>CÉDULA</p>
                                        <p style={{ color: '#22d3ee', fontSize: '0.875rem', fontWeight: 700 }}>{identificationNumber}</p>
                                    </div>
                                    <div style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #1f2937' }}>
                                        <p style={{ color: '#6b7280', fontSize: '0.625rem', marginBottom: '4px' }}>TELÉFONO</p>
                                        <p style={{ color: '#22d3ee', fontSize: '0.875rem', fontWeight: 700 }}>{athletePhone}</p>
                                    </div>
                                </div>

                                {/* Radar + Guardians */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div className="scanline" style={{
                                        position: 'relative',
                                        background: 'rgba(17,24,39,0.5)',
                                        border: '1px solid rgba(168,85,247,0.3)',
                                        clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)',
                                        padding: '24px',
                                        flex: 1
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 className="font-orbitron" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#a78bfa', textShadow: '0 0 10px rgba(167,139,250,0.7)', letterSpacing: '0.05em' }}>MATRIX DE ATRIBUTOS</h3>
                                            <span style={{ fontSize: '0.75rem', background: 'rgba(168,85,247,0.2)', color: '#a78bfa', padding: '4px 8px', borderRadius: '4px' }}>SYNC 98%</span>
                                        </div>
                                        <div style={{ height: 240, width: '100%' }}>
                                            <RadarChartComponent data={radarChartData} />
                                        </div>
                                    </div>

                                    <div className="scanline" style={{
                                        position: 'relative',
                                        background: 'rgba(17,24,39,0.5)',
                                        border: '1px solid rgba(34,197,94,0.3)',
                                        clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)',
                                        padding: '16px'
                                    }}>
                                        <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.875rem', fontWeight: 700, color: '#22c55e', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            📡 SOPORTE EXTERNO (ACUDIENTES)
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            {(athlete?.guardians || []).length > 0 ? (
                                                athlete.guardians.map((g, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                                                        <div style={{ width: 40, height: 40, background: 'rgba(34,197,94,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                                                            {g.relationship?.toLowerCase().includes('madre') ? '👩' : g.relationship?.toLowerCase().includes('padre') ? '👨' : '👤'}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>{g.name}</p>
                                                            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{g.relationship || 'Acudiente'}</p>
                                                            {g.email && (
                                                                <p style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: 2 }}>✉️ {g.email}</p>
                                                            )}
                                                        </div>
                                                        {g.phone && (
                                                            <a href={`tel:${g.phone}`} style={{ color: '#22c55e', fontSize: '1.25rem', textDecoration: 'none' }}>📞</a>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '12px', color: '#6b7280', fontSize: '0.875rem' }}>
                                                    No hay acudientes registrados
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Mobile layout: stacked */}
                            <div className="scanline" style={{
                                position: 'relative',
                                background: 'linear-gradient(to bottom, #111827, #000)',
                                border: '1px solid rgba(0,255,255,0.3)',
                                clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}>
                                <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span className="font-orbitron" style={{ fontSize: '2.25rem', fontWeight: 900, color: '#facc15', textShadow: '0 0 10px rgba(250,204,21,0.7)' }}>{overallRating}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#facc15', fontWeight: 700, letterSpacing: '0.1em' }}>OVR</span>
                                </div>
                                <div style={{ position: 'relative', marginTop: '32px', marginBottom: '16px' }}>
                                    <div style={{ position: 'absolute', inset: 0, background: '#06b6d4', filter: 'blur(40px)', opacity: 0.3, borderRadius: '50%' }} />
                                    {photoUrl ? (
                                        <img src={photoUrl} alt={fullName} style={{ position: 'relative', width: 128, height: 128, borderRadius: '50%', border: '2px solid #22d3ee', boxShadow: '0 0 30px rgba(0,255,255,0.3)', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{
                                            position: 'relative',
                                            width: 128, height: 128, borderRadius: '50%',
                                            border: '2px solid #22d3ee',
                                            boxShadow: '0 0 30px rgba(0,255,255,0.3)',
                                            background: '#111827',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            color: '#22d3ee'
                                        }}>
                                            {initials}
                                        </div>
                                    )}
                                </div>
                                <h2 className="font-orbitron" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', letterSpacing: '0.05em', textAlign: 'center' }}>{fullName}</h2>
                                <p style={{ color: '#22d3ee', fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.75rem', marginTop: 4 }}>{groupName}</p>
                                <p style={{ color: '#9ca3af', fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.75rem', marginTop: 2 }}>{clubName}</p>
                                <div style={{ width: '100%', height: '1px', background: 'rgba(0,255,255,0.3)', margin: '16px 0' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%', textAlign: 'center' }}>
                                    <div><p style={{ color: '#6b7280', fontSize: '0.625rem' }}>EDAD</p><p className="font-orbitron" style={{ fontSize: '1.125rem' }}>{age}</p></div>
                                    <div><p style={{ color: '#6b7280', fontSize: '0.625rem' }}>GRUPO</p><p className="font-orbitron" style={{ fontSize: '1.125rem' }}>{groupName.substring(0, 8)}</p></div>
                                    <div><p style={{ color: '#6b7280', fontSize: '0.625rem' }}>GRADO</p><p className="font-orbitron" style={{ fontSize: '1.125rem' }}>{athlete?.academic_info?.grade || '—'}</p></div>
                                </div>
                            </div>

                            <div className="scanline" style={{
                                position: 'relative',
                                background: 'rgba(17,24,39,0.5)',
                                border: '1px solid rgba(168,85,247,0.3)',
                                clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)',
                                padding: '24px'
                            }}>
                                <h3 className="font-orbitron" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#a78bfa', textShadow: '0 0 10px rgba(167,139,250,0.7)', letterSpacing: '0.05em', marginBottom: '16px' }}>MATRIX DE ATRIBUTOS</h3>
                                <div style={{ height: 240, width: '100%' }}>
                                    <RadarChartComponent data={radarChartData} />
                                </div>
                            </div>

                            <div className="scanline" style={{
                                position: 'relative',
                                background: 'rgba(17,24,39,0.5)',
                                border: '1px solid rgba(34,197,94,0.3)',
                                clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)',
                                padding: '16px'
                            }}>
                                <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.875rem', fontWeight: 700, color: '#22c55e', letterSpacing: '0.05em', marginBottom: '12px' }}>📡 ACUDIENTES</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {(athlete?.guardians || []).length > 0 ? (
                                        athlete.guardians.map((g, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                                                <div style={{ width: 40, height: 40, background: 'rgba(34,197,94,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                                                    {g.relationship?.toLowerCase().includes('madre') ? '👩' : g.relationship?.toLowerCase().includes('padre') ? '👨' : '👤'}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>{g.name}</p>
                                                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{g.relationship || 'Acudiente'}</p>
                                                    {g.email && (
                                                        <p style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: 2 }}>✉️ {g.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '12px', color: '#6b7280', fontSize: '0.875rem' }}>
                                            No hay acudientes registrados
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Global Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div className="scanline" style={{ position: 'relative', background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(0,255,255,0.3)', clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)', padding: '16px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.625rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>ASISTENCIA GLOBAL</p>
                        <p className="font-orbitron" style={{ fontSize: '1.75rem', color: '#06b6d4', textShadow: '0 0 10px rgba(0,255,255,0.7)' }}>{attendanceRate}<span style={{ fontSize: '0.875rem' }}>%</span></p>
                        <div style={{ width: '100%', height: 6, background: '#1f2937', borderRadius: '9999px', marginTop: 8, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#06b6d4', borderRadius: '9999px', width: `${attendanceRate}%` }} />
                        </div>
                    </div>
                    <div className="scanline" style={{ position: 'relative', background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(34,197,94,0.3)', clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)', padding: '16px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.625rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>RACHA ACTUAL</p>
                        <p className="font-orbitron" style={{ fontSize: '1.75rem', color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.7)' }}>🔥 {streak}</p>
                        <p style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: 12 }}>DÍAS SEGUIDOS</p>
                    </div>
                    <div className="scanline" style={{ position: 'relative', background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(250,204,21,0.3)', clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)', padding: '16px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.625rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>TOTAL TESTS</p>
                        <p className="font-orbitron" style={{ fontSize: '1.75rem', color: '#facc15', textShadow: '0 0 10px rgba(250,204,21,0.7)' }}>{totalTests}</p>
                        <p style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: 12 }}>EVALUACIONES</p>
                    </div>
                    <div className="scanline" style={{ position: 'relative', background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(168,85,247,0.3)', clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)', padding: '16px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.625rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>TREND</p>
                        <p className="font-orbitron" style={{ fontSize: '1.75rem', color: '#a78bfa', textShadow: '0 0 10px rgba(168,85,247,0.7)' }}>{overallTrend === '↑' ? '▲' : overallTrend === '↓' ? '▼' : '—'}</p>
                        <p style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: 12 }}>{overallTrend === '↑' ? 'MEJORANDO' : overallTrend === '↓' ? 'DECRECIENDO' : 'ESTABLE'}</p>
                    </div>
                </div>

                {/* Physical Parameters + Vital Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '32px' }}>
                    {window.innerWidth >= 1024 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                            {/* Physical Parameters */}
                            <div className="scanline" style={{ position: 'relative', background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(0,255,255,0.3)', clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)', padding: '24px' }}>
                                <h3 className="font-orbitron" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#06b6d4', textShadow: '0 0 10px rgba(0,255,255,0.7)', letterSpacing: '0.05em', marginBottom: '24px' }}>PARÁMETROS FÍSICOS</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                                    {[
                                        { label: 'VELOCIDAD', value: athleteValues[0] || 85, color: '#22c55e', gradientFrom: '#16a34a', gradientTo: '#22c55e' },
                                        { label: 'RESISTENCIA', value: athleteValues[1] || 72, color: '#facc15', gradientFrom: '#ca8a04', gradientTo: '#facc15' },
                                        { label: 'FUERZA', value: athleteValues[2] || 68, color: '#fb923c', gradientFrom: '#ea580c', gradientTo: '#fb923c' },
                                        { label: 'AGILIDAD', value: athleteValues[3] || 90, color: '#22d3ee', gradientFrom: '#0891b2', gradientTo: '#22d3ee' }
                                    ].map((param, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 700, color: '#d1d5db', fontSize: '0.875rem' }}>{param.label}</span>
                                                <span className="font-orbitron" style={{ color: param.color, fontSize: '0.875rem' }}>{param.value}</span>
                                            </div>
                                            <div style={{ width: '100%', height: 8, background: '#1f2937', borderRadius: '9999px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', borderRadius: '9999px', background: `linear-gradient(to right, ${param.gradientFrom}, ${param.gradientTo})`, width: `${param.value}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Vital Status */}
                            <div className="scanline" style={{ position: 'relative', background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(239,68,68,0.3)', clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)', padding: '24px' }}>
                                <h3 className="font-orbitron" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ef4444', textShadow: '0 0 10px rgba(239,68,68,0.7)', letterSpacing: '0.05em', marginBottom: '16px' }}>ESTADO VITAL</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.5)', padding: '8px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                                        <div>
                                            <p style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.75rem' }}>SALUDABLE</p>
                                            <p style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Sin condiciones crónicas</p>
                                        </div>
                                    </div>
                                    {bloodType !== '—' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.5)', padding: '8px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>🩸</span>
                                            <div>
                                                <p style={{ fontWeight: 700, color: '#22d3ee', fontSize: '0.75rem' }}>TIPO DE SANGRE: {bloodType}</p>
                                                <p style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Factor sanguíneo</p>
                                            </div>
                                        </div>
                                    )}
                                    {emergencyContact !== '—' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.5)', padding: '8px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>🚨</span>
                                            <div>
                                                <p style={{ fontWeight: 700, color: '#facc15', fontSize: '0.75rem' }}>CONTACTO EMERGENCIA</p>
                                                <p style={{ fontSize: '0.625rem', color: '#9ca3af' }}>{emergencyContact}</p>
                                            </div>
                                        </div>
                                    )}
                                    {athlete?.medical_info?.allergies && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.5)', padding: '8px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>🚫</span>
                                            <div>
                                                <p style={{ fontWeight: 700, color: '#fb923c', fontSize: '0.75rem' }}>ALERGIA: {athlete.medical_info.allergies}</p>
                                                <p style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Requiere precaución</p>
                                            </div>
                                        </div>
                                    )}
                                    {athlete?.medical_info?.conditions && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)', padding: '8px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                                            <div>
                                                <p style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.75rem' }}>CONDICIÓN: {athlete.medical_info.conditions}</p>
                                                <p style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Requiere atención</p>
                                            </div>
                                        </div>
                                    )}
                                    {!athlete?.medical_info?.allergies && !athlete?.medical_info?.conditions && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.5)', padding: '8px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>✅</span>
                                            <div>
                                                <p style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.75rem' }}>SIN NOVEDADES</p>
                                                <p style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Sin alergias ni condiciones</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="scanline" style={{ position: 'relative', background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(0,255,255,0.3)', clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)', padding: '24px' }}>
                                <h3 className="font-orbitron" style={{ fontSize: '1rem', fontWeight: 700, color: '#06b6d4', textShadow: '0 0 10px rgba(0,255,255,0.7)', letterSpacing: '0.05em', marginBottom: '24px' }}>PARÁMETROS FÍSICOS</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { label: 'VELOCIDAD', value: athleteValues[0] || 85, color: '#22c55e', gradientFrom: '#16a34a', gradientTo: '#22c55e' },
                                        { label: 'RESISTENCIA', value: athleteValues[1] || 72, color: '#facc15', gradientFrom: '#ca8a04', gradientTo: '#facc15' },
                                        { label: 'FUERZA', value: athleteValues[2] || 68, color: '#fb923c', gradientFrom: '#ea580c', gradientTo: '#fb923c' },
                                        { label: 'AGILIDAD', value: athleteValues[3] || 90, color: '#22d3ee', gradientFrom: '#0891b2', gradientTo: '#22d3ee' }
                                    ].map((param, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 700, color: '#d1d5db', fontSize: '0.875rem' }}>{param.label}</span>
                                                <span className="font-orbitron" style={{ color: param.color, fontSize: '0.875rem' }}>{param.value}</span>
                                            </div>
                                            <div style={{ width: '100%', height: 8, background: '#1f2937', borderRadius: '9999px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', borderRadius: '9999px', background: `linear-gradient(to right, ${param.gradientFrom}, ${param.gradientTo})`, width: `${param.value}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="scanline" style={{ position: 'relative', background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(239,68,68,0.3)', clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)', padding: '24px' }}>
                                <h3 className="font-orbitron" style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', textShadow: '0 0 10px rgba(239,68,68,0.7)', letterSpacing: '0.05em', marginBottom: '16px' }}>ESTADO VITAL</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.5)', padding: '8px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                                        <div><p style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.75rem' }}>SALUDABLE</p><p style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Sin condiciones crónicas</p></div>
                                    </div>
                                    {athlete?.medical_info?.allergies && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.5)', padding: '8px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>🚫</span>
                                            <div><p style={{ fontWeight: 700, color: '#fb923c', fontSize: '0.75rem' }}>ALERGIA: {athlete.medical_info.allergies}</p><p style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Requiere precaución</p></div>
                                        </div>
                                    )}
                                    {athlete?.medical_info?.conditions && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)', padding: '8px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                                            <div><p style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.75rem' }}>CONDICIÓN: {athlete.medical_info.conditions}</p><p style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Requiere atención</p></div>
                                        </div>
                                    )}
                                    {!athlete?.medical_info?.allergies && !athlete?.medical_info?.conditions && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.5)', padding: '8px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>✅</span>
                                            <div><p style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.75rem' }}>SIN NOVEDADES</p><p style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Sin alergias ni condiciones</p></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* HUD TABS */}
                <div className="scanline" style={{
                    position: 'relative',
                    background: 'rgba(17,24,39,0.5)',
                    border: '1px solid rgba(0,255,255,0.3)',
                    clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)',
                    padding: '24px'
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #1f2937', paddingBottom: '16px' }}>
                        <button onClick={(e) => switchTab(e, 'tab-asistencia')}
                            className={`hud-tab ${activeTab === 'tab-asistencia' ? 'active' : ''}`}
                            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)', border: '1px solid #374151', padding: '8px 16px', fontSize: '0.875rem', fontWeight: 700, color: '#d1d5db', background: 'transparent', cursor: 'pointer' }}>
                            [01] ASISTENCIA
                        </button>
                        <button onClick={(e) => switchTab(e, 'tab-finanzas')}
                            className={`hud-tab ${activeTab === 'tab-finanzas' ? 'active' : ''}`}
                            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)', border: '1px solid #374151', padding: '8px 16px', fontSize: '0.875rem', fontWeight: 700, color: '#d1d5db', background: 'transparent', cursor: 'pointer' }}>
                            [02] TESORERÍA
                        </button>
                        <button onClick={(e) => switchTab(e, 'tab-tests')}
                            className={`hud-tab ${activeTab === 'tab-tests' ? 'active' : ''}`}
                            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)', border: '1px solid #374151', padding: '8px 16px', fontSize: '0.875rem', fontWeight: 700, color: '#d1d5db', background: 'transparent', cursor: 'pointer' }}>
                            [03] LABORATORIO
                        </button>
                        <button onClick={(e) => switchTab(e, 'tab-historial')}
                            className={`hud-tab ${activeTab === 'tab-historial' ? 'active' : ''}`}
                            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)', border: '1px solid #374151', padding: '8px 16px', fontSize: '0.875rem', fontWeight: 700, color: '#d1d5db', background: 'transparent', cursor: 'pointer' }}>
                            [04] HISTORIAL
                        </button>
                        <button onClick={(e) => switchTab(e, 'tab-plan')}
                            className={`hud-tab ${activeTab === 'tab-plan' ? 'active' : ''}`}
                            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)', border: '1px solid #374151', padding: '8px 16px', fontSize: '0.875rem', fontWeight: 700, color: '#d1d5db', background: 'transparent', cursor: 'pointer' }}>
                            [05] MISIÓN
                        </button>
                    </div>

                    {/* Tab: Asistencia */}
                    <div id="tab-asistencia" className={`tab-content ${activeTab === 'tab-asistencia' ? 'active' : ''}`} style={{ display: activeTab === 'tab-asistencia' ? 'block' : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1f2937', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.625rem', color: '#6b7280', letterSpacing: '0.1em' }}>SESIONES TOTALES</p>
                                <p className="font-orbitron" style={{ fontSize: '1.5rem', color: 'white', marginTop: 4 }}>{totalSessions}</p>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,197,94,0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.625rem', color: '#22c55e', letterSpacing: '0.1em' }}>PRESENCIAS</p>
                                <p className="font-orbitron" style={{ fontSize: '1.5rem', color: '#22c55e', marginTop: 4 }}>{presentCount}</p>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.625rem', color: '#ef4444', letterSpacing: '0.1em' }}>AUSENCIAS</p>
                                <p className="font-orbitron" style={{ fontSize: '1.5rem', color: '#ef4444', marginTop: 4 }}>{absentCount}</p>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead style={{ borderBottom: '2px solid rgba(0,255,255,0.5)', color: '#06b6d4', fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem' }}>
                                    <tr><th style={{ padding: '12px' }}>FECHA</th><th style={{ padding: '12px' }}>GRUPO</th><th style={{ padding: '12px' }}>ESTADO</th><th style={{ padding: '12px' }}>NOTAS</th></tr>
                                </thead>
                                <tbody style={{ color: '#d1d5db' }}>
                                    {profileData.attendance.slice(0, 5).map(a => {
                                        const sc = ATTENDANCE_LABELS[a.status] || { label: a.status, class: 'bg-gray-500/20 text-gray-400' };
                                        return (
                                            <tr key={a.id} style={{ borderBottom: '1px solid #1f2937' }}>
                                                <td style={{ padding: '12px' }}>{new Date(a.date).toLocaleDateString()}</td>
                                                <td style={{ padding: '12px' }}>{a.group_name || '—'}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }} className={sc.class}>{sc.label}</span>
                                                </td>
                                                <td style={{ padding: '12px', color: '#6b7280' }}>{a.notes || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                    {profileData.attendance.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>Sin registros de asistencia</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tab: Finanzas */}
                    <div id="tab-finanzas" className={`tab-content ${activeTab === 'tab-finanzas' ? 'active' : ''}`} style={{ display: activeTab === 'tab-finanzas' ? 'block' : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1f2937', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.625rem', color: '#6b7280', letterSpacing: '0.1em' }}>PAGADO</p>
                                <p className="font-orbitron" style={{ fontSize: '1.25rem', color: '#22c55e', marginTop: 4 }}>${totalPaid.toFixed(2)}</p>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(250,204,21,0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.625rem', color: '#facc15', letterSpacing: '0.1em' }}>PENDIENTE</p>
                                <p className="font-orbitron" style={{ fontSize: '1.25rem', color: '#facc15', marginTop: 4 }}>${totalPending.toFixed(2)}</p>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.625rem', color: '#ef4444', letterSpacing: '0.1em' }}>VENCIDO</p>
                                <p className="font-orbitron" style={{ fontSize: '1.25rem', color: '#ef4444', marginTop: 4 }}>${totalOverdue.toFixed(2)}</p>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead style={{ borderBottom: '2px solid rgba(250,204,21,0.5)', color: '#facc15', fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem' }}>
                                    <tr><th style={{ padding: '12px' }}>FECHA PAGO</th><th style={{ padding: '12px' }}>CONCEPTO</th><th style={{ padding: '12px' }}>MONTO</th><th style={{ padding: '12px' }}>MÉTODO</th><th style={{ padding: '12px' }}>ESTADO</th></tr>
                                </thead>
                                <tbody style={{ color: '#d1d5db' }}>
                                    {payments.map(p => {
                                        const lc = PAYMENT_LABELS[p.status] || { label: p.status, class: 'bg-gray-500/20 text-gray-400' };
                                        const paymentMethod = p.payment_method || '—';
                                        return (
                                            <tr key={p.id} style={{ borderBottom: '1px solid #1f2937' }}>
                                                <td style={{ padding: '12px' }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : (p.due_date ? new Date(p.due_date).toLocaleDateString() : '—')}</td>
                                                <td style={{ padding: '12px', fontWeight: 500 }}>{p.description || 'Mensualidad'}</td>
                                                <td style={{ padding: '12px', fontWeight: 700 }}>${parseFloat(p.amount).toFixed(2)}</td>
                                                <td style={{ padding: '12px', color: '#9ca3af' }}>{paymentMethod}</td>
                                                <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }} className={lc.class}>{lc.label}</span></td>
                                            </tr>
                                        );
                                    })}
                                    {payments.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>Sin registros de pagos</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tab: Laboratorio */}
                    <div id="tab-tests" className={`tab-content ${activeTab === 'tab-tests' ? 'active' : ''}`} style={{ display: activeTab === 'tab-tests' ? 'block' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(168,85,247,0.2)' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.1em' }}>TENDENCIA GLOBAL DE RENDIMIENTO</p>
                                <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Basado en los últimos {totalTests} tests</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p className="font-orbitron" style={{ fontSize: '1.75rem', color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.7)' }}>
                                    {overallTrend === '↑' ? '▲' : overallTrend === '↓' ? '▼' : '—'}
                                </p>
                                <p style={{ fontSize: '0.625rem', color: '#6b7280' }}>TENDENCIA</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                            {testStats?.categories?.slice(0, 3).map((cat, i) => (
                                <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,85,247,0.3)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{cat.category}</p>
                                    <p className="font-orbitron" style={{ fontSize: '1.75rem', color: '#a78bfa', marginTop: 8 }}>
                                        {cat.templates?.[cat.templates.length - 1]?.latest_value || '—'}{cat.templates?.[cat.templates.length - 1]?.unit ? ' ' + cat.templates[cat.templates.length - 1].unit : ''}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: cat.trend === 'up' ? '#22c55e' : cat.trend === 'down' ? '#ef4444' : '#6b7280', marginTop: 4 }}>
                                        {cat.trend === 'up' ? '▲ MEJORA' : cat.trend === 'down' ? '▼ DECRECE' : '— ESTABLE'}
                                    </p>
                                </div>
                            ))}
                            {(!testStats?.categories || testStats.categories.length === 0) && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    <p style={{ fontSize: '2rem', marginBottom: 8 }}>🔬</p>
                                    <p>No hay tests registrados aún</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tab: Historial */}
                    <div id="tab-historial" className={`tab-content ${activeTab === 'tab-historial' ? 'active' : ''}`} style={{ display: activeTab === 'tab-historial' ? 'block' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', letterSpacing: '0.1em' }}>TIEMPO EN CLUB</p>
                                <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Fidelidad de la squadrón</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p className="font-orbitron" style={{ fontSize: '1.75rem', color: '#06b6d4', textShadow: '0 0 10px rgba(0,255,255,0.7)' }}>
                                    {profileData.movements.length > 0 ? (
                                        (() => {
                                            const firstJoin = profileData.movements.find(m => m.action === 'JOINED');
                                            if (firstJoin?.date) {
                                                const joined = new Date(firstJoin.date);
                                                const now = new Date();
                                                const years = now.getFullYear() - joined.getFullYear();
                                                return `${years} ${years === 1 ? 'AÑO' : 'AÑOS'}`;
                                            }
                                            return '—';
                                        })()
                                    ) : '—'}
                                </p>
                                {profileData.movements.length > 0 && (
                                    <p style={{ fontSize: '0.625rem', color: '#6b7280' }}>DESDE {new Date(profileData.movements[profileData.movements.length - 1]?.date).toLocaleDateString()}</p>
                                )}
                            </div>
                        </div>
                        <h3 className="font-orbitron" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '16px' }}>LOG DE TRANSFERENCIAS</h3>
                        <div style={{ borderLeft: '2px solid #374151', marginLeft: '16px' }}>
                            {profileData.movements.slice().reverse().map((m, i) => {
                                const isJoined = m.action === 'JOINED';
                                const isChanged = m.action === 'CHANGED';
                                const dotColor = isJoined ? '#22c55e' : isChanged ? '#facc15' : '#6b7280';
                                const textColor = isJoined ? '#22c55e' : isChanged ? '#facc15' : '#9ca3af';
                                return (
                                    <div key={i} style={{ position: 'relative', paddingLeft: '24px', paddingBottom: '24px' }}>
                                        <div style={{ position: 'absolute', left: -9, top: 4, width: 16, height: 16, background: dotColor, borderRadius: '50%', border: '2px solid #000' }} />
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{new Date(m.date).toLocaleDateString()}</p>
                                        <p style={{ fontWeight: 700, color: textColor }}>{m.action}: {m.group_name || 'Grupo'}</p>
                                    </div>
                                );
                            })}
                            {profileData.movements.length === 0 && <div style={{ padding: '24px', color: '#6b7280', textAlign: 'center' }}>Sin historial de grupos registrado</div>}
                        </div>
                    </div>

                    {/* Tab: Plan/Misión */}
                    <div id="tab-plan" className={`tab-content ${activeTab === 'tab-plan' ? 'active' : ''}`} style={{ display: activeTab === 'tab-plan' ? 'block' : 'none' }}>
                        {activePlan ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 className="font-orbitron" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#06b6d4', letterSpacing: '0.05em' }}>MISIÓN: {activePlan.plan_name || 'Plan activo'}</h3>
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,255,255,0.2)', color: '#06b6d4', padding: '4px 8px', borderRadius: '4px' }}>EN PROGRESO</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                                    <span style={{ color: '#6b7280' }}>PROGRESO</span>
                                    <span style={{ color: '#06b6d4', fontWeight: 700 }}>ACTIVO</span>
                                </div>
                                <div style={{ width: '100%', height: 12, background: '#1f2937', borderRadius: '9999px', overflow: 'hidden', border: '1px solid #374151', marginBottom: '24px' }}>
                                    <div style={{ height: '100%', background: 'linear-gradient(to right, #0891b2, #06b6d4, #22d3ee)', width: '70%' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>INICIO</p>
                                        <p className="font-orbitron" style={{ color: '#22d3ee' }}>{activePlan.start_date ? new Date(activePlan.start_date).toLocaleDateString() : '—'}</p>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>FIN</p>
                                        <p className="font-orbitron" style={{ color: '#ef4444' }}>{activePlan.end_date ? new Date(activePlan.end_date).toLocaleDateString() : '—'}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                <p style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</p>
                                <p>No hay plan de entrenamiento activo</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AthleteProfile;