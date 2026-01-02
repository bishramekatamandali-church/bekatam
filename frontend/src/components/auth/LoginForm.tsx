import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { EyeIcon, EyeSlashIcon } from '../icons/GenericIcons';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onLoginSuccess: () => void;
}

const REMEMBERED_IDENTIFIER_KEY = 'bem_rememberedIdentifier';

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSwitchToForgotPassword, onLoginSuccess }) => {
  const [identifierInput, setIdentifierInput] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    const rememberedIdentifier = localStorage.getItem(REMEMBERED_IDENTIFIER_KEY);
    if (rememberedIdentifier) {
      setIdentifierInput(rememberedIdentifier);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(identifierInput, password, rememberMe);
      if (success) {
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, identifierInput);
        } else {
          localStorage.removeItem(REMEMBERED_IDENTIFIER_KEY);
        }
        onLoginSuccess();
      } else {
        setError("Invalid credentials. Please check your email/phone/username and password.");
      }
    } catch (err) {
      setError("Failed to login. Please try again.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-identifier" className="block text-xs font-medium text-slate-700">Email, Phone, or Username</label>
          <input
            type="text"
            id="login-identifier"
            name="identifier"
            value={identifierInput}
            onChange={(e) => setIdentifierInput(e.target.value)}
            required
            autoComplete="username"
            className="mt-1 block w-full p-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            aria-describedby="identifier-error"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-xs font-medium text-slate-700">Password</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              id="login-password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="block w-full p-2.5 border border-slate-300 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              aria-describedby="password-error"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-amber-600 border-slate-300 rounded-md focus:ring-amber-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-900">Remember me</label>
          </div>
          <div className="text-sm">
            <button 
              type="button" 
              onClick={onSwitchToForgotPassword} 
              className="font-medium text-amber-600 hover:text-amber-500"
            >
              Forgot password?
            </button>
          </div>
        </div>
        {error && <p id="identifier-error" className="text-sm text-red-600" role="alert">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
        <p className="text-sm text-center text-slate-600">
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToRegister} className="font-medium text-amber-600 hover:text-amber-500">
            Register here
          </button>
        </p>
      </form>
    </>
  );
};

export default LoginForm;