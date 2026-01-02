import React, { useState } from 'react';
import Modal from '../ui/Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';   // ✅ FIXED
import ForgotPasswordForm from './ForgotPasswordForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register' | 'forgotPassword';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>(initialView);

  const handleClose = () => {
    onClose();
    setTimeout(() => setView('login'), 300); 
  };
  
  const handleAuthSuccess = () => {
    handleClose();
  };

  const getTitle = () => {
    if (view === 'login') return "Login to Your Account";
    if (view === 'register') return "Create an Account";
    if (view === 'forgotPassword') return "Forgot Password";
    return '';
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={getTitle()}
    >
      {view === 'login' && (
        <LoginForm 
          onSwitchToRegister={() => setView('register')} 
          onSwitchToForgotPassword={() => setView('forgotPassword')}
          onLoginSuccess={handleAuthSuccess} 
        />
      )}
      {view === 'register' && (
        <RegisterForm 
          onSwitchToLogin={() => setView('login')}
          onRegisterSuccess={handleAuthSuccess}
        />
      )}
      {view === 'forgotPassword' && (
        <ForgotPasswordForm
          onSwitchToLogin={() => setView('login')}
          onClose={handleClose}
        />
      )}
    </Modal>
  );
};

export default AuthModal;
