import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { GoogleIcon, XIcon, FacebookIcon, AppleIcon, MicrosoftIcon, GitHubIcon, LinkedInIcon } from '../icons/GenericIcons';

interface SocialLoginButtonsProps {
  onSocialLoginSuccess: () => void;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ onSocialLoginSuccess }) => {
  const { 
    loginWithGoogle, 
    loginWithX, 
    loginWithFacebook, 
    loginWithApple, 
    loginWithMicrosoft,
    loginWithGitHub,
    loginWithLinkedIn,
    loadingAuthState 
  } = useAuth();

  const handleSocialLogin = async (loginMethod: () => Promise<boolean>) => {
    try {
      const success = await loginMethod();
      if (success) {
        onSocialLoginSuccess();
      } else {
        console.error("Social login failed (simulated path).");
      }
    } catch (error) {
      console.error("Error during social login:", error);
    }
  };

  const socialButtons = [
    { method: loginWithGoogle, Icon: GoogleIcon, label: "Sign in with Google" },
    { method: loginWithFacebook, Icon: FacebookIcon, label: "Sign in with Facebook" },
    { method: loginWithApple, Icon: AppleIcon, label: "Sign in with Apple" },
    { method: loginWithMicrosoft, Icon: MicrosoftIcon, label: "Sign in with Microsoft" },
    { method: loginWithGitHub, Icon: GitHubIcon, label: "Sign in with GitHub" },
    { method: loginWithLinkedIn, Icon: LinkedInIcon, label: "Sign in with LinkedIn" },
    { method: loginWithX, Icon: XIcon, label: "Sign in with X" },
  ];

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or continue with</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {socialButtons.map(social => (
          <Button
            key={social.label}
            type="button"
            onClick={() => handleSocialLogin(social.method)}
            variant="outline"
            className="w-full flex items-center justify-center !text-slate-700 hover:!bg-slate-50 dark:!text-slate-200 dark:hover:!bg-slate-700"
            disabled={loadingAuthState}
          >
            <social.Icon className="h-5 w-5 mr-2" />
            <span>{social.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SocialLoginButtons;
