import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TrainerSidebar from './TrainerSidebar';
import Topbar from '../UI/Topbar';

const TrainerLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [sidebarOpen]);

    return (
        <div className="app-shell">
            <button className="mobile-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">☰</button>
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
            <TrainerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="app-main">
                <Topbar breadcrumb="Club" title="Panel de Entrenador" />
                <div className="app-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default TrainerLayout;