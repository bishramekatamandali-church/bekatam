
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { EyeIcon, EyeSlashIcon } from '../icons/GenericIcons';

interface ResetPasswordFormProps {
  token: string;
  onResetSuccess: () => void;
  onResetFailure: (error: string) => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token, onResetSuccess, onResetFailure }) => {
  const { resetPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      onResetFailure("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      onResetFailure("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, newPassword);
    setLoading(false);

    if (result.success) {
      onResetSuccess();
    } else {
      onResetFailure(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          New Password
        </label>
        <div className="relative mt-1">
          <input
            type={showNewPassword ? 'text' : 'password'}
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirm-new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Confirm New Password
        </label>
        <div className="relative mt-1">
          <input
            type={showConfirmNewPassword ? 'text' : 'password'}
            id="confirm-new-password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            className="block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
          />
          <button
            type="button"
            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
          >
            {showConfirmNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;