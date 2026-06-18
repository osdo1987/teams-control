import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'error', duration = 5000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    background: '#10b981',
                    icon: '✅',
                };
            case 'warning':
                return {
                    background: '#f59e0b',
                    icon: '⚠️',
                };
            case 'info':
                return {
                    background: '#3b82f6',
                    icon: 'ℹ️',
                };
            case 'error':
            default:
                return {
                    background: '#ef4444',
                    icon: '❌',
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: styles.background,
                color: '#fff',
                padding: '16px 20px',
                borderRadius: '8px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '300px',
                maxWidth: '500px',
                animation: 'slideIn 0.3s ease-out',
            }}
        >
            <span style={{ fontSize: '1.2rem' }}>{styles.icon}</span>
            <span style={{ flex: 1 }}>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '0',
                    lineHeight: 1,
                    opacity: 0.8,
                }}
            >
                ×
            </button>
        </div>
    );
};

export default Toast;