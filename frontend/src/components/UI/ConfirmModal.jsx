import React from 'react';
import Modal from './Modal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  const footer = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>{cancelText}</button>
      <button
        className="btn btn-primary"
        style={{ background: type === 'danger' ? 'var(--danger-color)' : 'var(--primary-color)', boxShadow: type === 'danger' ? '0 2px 8px rgba(239,68,68,0.3)' : undefined }}
        onClick={onConfirm}
      >
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
};

export default ConfirmModal;
