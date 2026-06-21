import React, { useEffect } from 'react';
import './Drawer.css';

const Drawer = ({ isOpen, onClose, title, children, footer }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <>
            <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
            <div className={`drawer ${isOpen ? 'active' : ''}`}>
                <div className="drawer-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="drawer-body">
                    {children}
                </div>
                {footer && (
                    <div className="drawer-footer">
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
};

export default Drawer;