import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { EyeIcon, EyeSlashIcon } from '../icons/GenericIcons';

const ChangePasswordForm: React.FC = () => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("All password fields are required.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password cannot be the same as the current password.");
      return;
    }

    setLoading(true);
    if (changePassword) {
        const result = await changePassword(currentPassword, newPassword);
        if (result.success) {
            setSuccessMessage(result.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } else {
            setError(result.message);
        }
    } else {
        setError("Password change feature is currently unavailable.");
    }
    setLoading(false);
  };

  const renderPasswordInput = (
    id: string,
    label: string,
    value: string,
    onChange: (val: string) => void,
    show: boolean,
    toggleShow: () => void
  ) => (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative mt-1">
        <input
          type={show ? 'text' : 'password'}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderPasswordInput(
        "currentPassword", 
        "Current Password", 
        currentPassword, 
        setCurrentPassword, 
        showCurrentPassword, 
        () => setShowCurrentPassword(!showCurrentPassword)
      )}
      {renderPasswordInput(
        "newPassword", 
        "New Password", 
        newPassword, 
        setNewPassword, 
        showNewPassword, 
        () => setShowNewPassword(!showNewPassword)
      )}
      {renderPasswordInput(
        "confirmNewPassword", 
        "Confirm New Password", 
        confirmNewPassword, 
        setConfirmNewPassword, 
        showConfirmNewPassword, 
        () => setShowConfirmNewPassword(!showConfirmNewPassword)
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
      {successMessage && <p className="text-sm text-green-600 dark:text-green-400" role="alert">{successMessage}</p>}
      
      <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={loading}>
        {loading ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
};

export default ChangePasswordForm;