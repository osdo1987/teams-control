import React from 'react';
import Modal from './Modal';
import { IconAlertCircle, IconTrash } from '../Icons';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'danger' }) => {
  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>{cancelText}</button>
      <button className={type === 'danger' ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
        {type === 'danger' && <IconTrash size={14} />}
        {confirmText}
      </button>
    </>
  );
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="sm">
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--danger-50)', color: 'var(--danger-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconAlertCircle size={22} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
