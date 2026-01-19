import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface GuestPrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contact: { email?: string; phone?: string }) => void;
}

const GuestPrayerModal: React.FC<GuestPrayerModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = contact.trim();
    if (!trimmed) {
      setError('Please enter an email or phone number.');
      return;
    }

    if (trimmed.includes('@')) {
      onSubmit({ email: trimmed });
      setContact('');
      setError('');
      return;
    }

    const normalizedPhone = trimmed.replace(/[\s()-]/g, '');
    if (!/^[+\d]{7,}$/.test(normalizedPhone)) {
      setError('Please enter a valid phone number or email.');
      return;
    }

    onSubmit({ phone: normalizedPhone });
    setContact('');
    setError('');
  };

  const handleClose = () => {
    setContact('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Pray as a Guest" size="sm">
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Enter your Gmail or phone number to record your prayer.
        </p>
        <input
          type="text"
          placeholder="Email or phone number"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-purple-500 focus:border-purple-500"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button onClick={handleSubmit} className="w-full">Confirm Prayer</Button>
      </div>
    </Modal>
  );
};

export default GuestPrayerModal;
