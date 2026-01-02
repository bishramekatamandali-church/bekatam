import React, { useState } from 'react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext'; 

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
  onClose: () => void; 
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSwitchToLogin, onClose }) => {
  const { forgotPassword } = useAuth(); 
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const result = await forgotPassword(email);

    setLoading(false);
    if (result.success) {
      let successMsg = result.message;
      if (result.token && process.env.NODE_ENV === 'development') { 
        successMsg += ` (Dev Demo Token: ${result.token})`;
      }
      setMessage(successMsg);
    } else {
      setError(result.message || "An unknown error occurred.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-slate-600">
        Enter your email address and we will send you a link to reset your password (simulation).
      </p>
      <div>
        <label htmlFor="forgot-email" className="block text-xs font-medium text-slate-700">Email Address</label>
        <input
          type="email"
          id="forgot-email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
        />
      </div>
      
      {message && <p className="text-sm text-green-600" role="alert">{message}</p>}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? "Sending..." : "Send Reset Link"}
      </Button>
      
      <p className="text-sm text-center text-slate-600">
        Remember your password?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-medium text-amber-600 hover:text-amber-500">
          Login here
        </button>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;