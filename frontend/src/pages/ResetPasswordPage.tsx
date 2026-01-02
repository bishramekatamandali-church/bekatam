



import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from "react-router-dom";
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LockClosedIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Basic token validation (e.g., presence).
    // In a real app, you might make an API call here to validate the token's format or existence pre-form display.
    // For this demo, we'll assume token format is okay and let the resetPassword context function handle full validation.
    if (!token) {
      setMessage("Invalid password reset link. Token is missing.");
      setIsError(true);
      setIsValidToken(false);
    } else {
      setIsValidToken(true); // Assume valid for form display, actual validation in AuthContext
    }
  }, [token]);

  const handleResetSuccess = () => {
    setMessage("Password has been reset successfully. You can now login with your new password.");
    setIsSuccess(true);
    setIsError(false);
  };

  const handleResetFailure = (errorMsg: string) => {
    setMessage(errorMsg);
    setIsError(true);
    setIsSuccess(false);
  };
  
  if (isValidToken === false) { // Explicitly check for false if token was determined missing
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-500" />
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">Invalid Link</h1>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-red-600 dark:text-red-400">{message}</p>
                    <div className="mt-6 text-center">
                        <Button asLink to="/" variant="primary">
                            Go to Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isSuccess ? (
            <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500" />
          ) : (
            <LockClosedIcon className="w-12 h-12 mx-auto text-purple-600 dark:text-purple-400" />
          )}
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">
            {isSuccess ? "Password Reset Successful" : "Reset Your Password"}
          </h1>
        </CardHeader>
        <CardContent>
          {isError && <p className="mb-4 text-sm text-red-600 dark:text-red-400 text-center" role="alert">{message}</p>}
          {isSuccess && !isError && <p className="mb-4 text-sm text-green-600 dark:text-green-400 text-center" role="alert">{message}</p>}
          
          {!isSuccess && token && isValidToken && (
            <ResetPasswordForm 
              token={token} 
              onResetSuccess={handleResetSuccess} 
              onResetFailure={handleResetFailure} 
            />
          )}

          {isSuccess && (
             <div className="mt-6 text-center">
                <Button onClick={() => navigate('/')} variant="primary"> {/* Or open login modal */}
                    Login Now
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;