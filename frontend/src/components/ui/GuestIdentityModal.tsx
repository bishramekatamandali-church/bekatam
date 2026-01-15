import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export interface GuestIdentity {
  name: string;
  email: string;
  phone: string;
}

interface GuestIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onConfirm: (identity: GuestIdentity) => Promise<void> | void;
  isSubmitting?: boolean;
}

const GuestIdentityModal: React.FC<GuestIdentityModalProps> = ({
  isOpen,
  onClose,
  title,
  onConfirm,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      alert('Please enter your name, email, and phone number.');
      return;
    }
    await onConfirm({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    setName('');
    setEmail('');
    setPhone('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-600">🙂 Please provide your details to continue.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600">🙂 Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full p-2 border border-slate-300 rounded-md text-sm"
              placeholder="Your name"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">📧 Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-2 border border-slate-300 rounded-md text-sm"
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">📱 Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full p-2 border border-slate-300 rounded-md text-sm"
              placeholder="Number"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : 'Continue'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GuestIdentityModal;
