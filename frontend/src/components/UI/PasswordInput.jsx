import React, { useState } from 'react';
import { IconEye, IconEyeOff } from '../Icons';

const PasswordInput = ({ value, onChange, name = 'password', placeholder = '••••••••', required = false, label = 'Contraseña', showStrength = false }) => {
    const [visible, setVisible] = useState(false);

    const getStrength = (pass) => {
        let score = 0;
        if (pass.length >= 8) score += 25;
        if (pass.length >= 12) score += 15;
        if (/[a-z]/.test(pass)) score += 15;
        if (/[A-Z]/.test(pass)) score += 15;
        if (/[0-9]/.test(pass)) score += 15;
        if (/[^a-zA-Z0-9]/.test(pass)) score += 15;
        return Math.min(score, 100);
    };

    const strength = showStrength ? getStrength(value) : 0;
    const strengthLabel = strength < 40 ? 'Débil' : strength < 70 ? 'Media' : 'Fuerte';
    const strengthColor = strength < 40 ? 'var(--danger-500)' : strength < 70 ? 'var(--warning-500)' : 'var(--success-500)';

    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type={visible ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="form-input"
                    required={required}
                    placeholder={placeholder}
                    autoComplete={name === 'password' ? 'new-password' : 'off'}
                    minLength={8}
                    style={{ paddingRight: '44px' }}
                />
                <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    tabIndex={-1}
                >
                    {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
            </div>
            {showStrength && value && (
                <div style={{ marginTop: '6px' }}>
                    <div style={{ height: '4px', background: 'var(--gray-200)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${strength}%`, height: '100%', background: strengthColor, borderRadius: '2px', transition: 'width 0.3s, background 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: strengthColor, fontWeight: 600, marginTop: '2px', display: 'block' }}>
                        {strengthLabel}
                    </span>
                    <ul style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '4px 0 0', paddingLeft: '16px', lineHeight: 1.6 }}>
                        <li style={{ color: value.length >= 8 ? 'var(--success-500)' : 'var(--text-muted)' }}>Mínimo 8 caracteres</li>
                        <li style={{ color: /[A-Z]/.test(value) ? 'var(--success-500)' : 'var(--text-muted)' }}>Al menos una mayúscula</li>
                        <li style={{ color: /[a-z]/.test(value) ? 'var(--success-500)' : 'var(--text-muted)' }}>Al menos una minúscula</li>
                        <li style={{ color: /[0-9]/.test(value) ? 'var(--success-500)' : 'var(--text-muted)' }}>Al menos un número</li>
                        <li style={{ color: /[^a-zA-Z0-9]/.test(value) ? 'var(--success-500)' : 'var(--text-muted)' }}>Al menos un carácter especial (@, #, $, etc.)</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PasswordInput;