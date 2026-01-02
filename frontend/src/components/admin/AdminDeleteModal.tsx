import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface AdminDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  itemName: string;
  isSubmitting: boolean;
}

const AdminDeleteModal: React.FC<AdminDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isSubmitting,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirmClick = () => {
    if (!reason.trim()) {
      setError('A reason is required for deletion.');
      return;
    }
    setError('');
    onConfirm(reason);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Delete "${itemName}"`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You are about to permanently delete this item. Please provide a reason for this action for accountability. This action will be logged.
        </p>
        <div>
          <label htmlFor="delete-reason" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Reason for Deletion
          </label>
          <textarea
            id="delete-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-slate-700 dark:text-slate-200"
            placeholder="e.g., 'Violated community guidelines: spam content.'"
            disabled={isSubmitting}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-700">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmClick}
            disabled={isSubmitting || !reason.trim()}
            className="!bg-red-600 hover:!bg-red-700 text-white"
          >
            {isSubmitting ? 'Deleting...' : 'Confirm Deletion'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdminDeleteModal;