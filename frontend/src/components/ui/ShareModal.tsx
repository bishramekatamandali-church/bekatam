import React, { useMemo, useState } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string; // URL of the event page to share
  eventTitle: string;
}

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const GmailIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2.25c-2.813 0-3.174.012-4.287.06-1.098.048-1.852.228-2.517.506a4.428 4.428 0 00-1.605 1.605c-.278.665-.458 1.419-.506 2.517C2.013 8.826 2 9.187 2 12s.012 3.174.06 4.287c.048 1.098.228 1.852.506 2.517a4.428 4.428 0 001.605 1.605c.665.278 1.419.458 2.517.506 1.113.048 1.474.06 4.287.06s3.174-.012 4.287-.06c1.098-.048 1.852-.228 2.517-.506a4.428 4.428 0 001.605-1.605c.278-.665.458-1.419.506-2.517.048-1.113.06-1.474.06-4.287s-.012-3.174-.06-4.287c-.048-1.098-.228-1.852-.506-2.517a4.428 4.428 0 00-1.605-1.605c-.665-.278-1.419-.458-2.517-.506C15.174 2.013 14.813 2 12 2zm0 1.8c2.734 0 3.07.011 4.152.06 1.001.043 1.595.21 1.966.357.502.203.88.47 1.252.842.372.372.639.75.842 1.252.147.371.314.965.357 1.966.049 1.082.06 1.418.06 4.152s-.011 3.07-.06 4.152c-.043 1.001-.21 1.595-.357 1.966a3.017 3.017 0 01-.842 1.252c-.372.372-.75.639-1.252.842-.371.147-.965.314-1.966.357-1.082.049-1.418.06-4.152.06s-3.07-.011-4.152-.06c-1.001-.043-1.595-.21-1.966-.357a3.017 3.017 0 01-1.252-.842 3.017 3.017 0 01-.842-1.252c-.147-.371-.314-.965-.357-1.966C3.812 15.07 3.8 14.734 3.8 12s.011-3.07.06-4.152c.043-1.001.21-1.595.357-1.966.203-.502.47-.88.842-1.252.372-.372.75-.639 1.252-.842.371-.147.965-.314 1.966-.357C8.93 3.812 9.266 3.8 12 3.8zM12 7.2a4.8 4.8 0 100 9.6 4.8 4.8 0 000-9.6zm0 7.8a3 3 0 110-6 3 3 0 010 6zm5.25-8.25a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" clipRule="evenodd" />
    </svg>
);

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a9.95 9.95 0 00-8.53 15.09L2 22l5.1-1.36A9.97 9.97 0 1012 2zm0 18.1a8.05 8.05 0 01-4.11-1.12l-.29-.17-3.02.8.81-2.94-.19-.3A8.06 8.06 0 1112 20.1zm4.67-5.8c-.26-.13-1.55-.77-1.79-.85-.24-.09-.41-.13-.58.13-.17.26-.66.85-.81 1.02-.15.17-.31.2-.57.07-.26-.13-1.11-.41-2.12-1.3-.78-.69-1.3-1.54-1.45-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.31.39-.47.13-.15.17-.26.26-.43.09-.17.04-.33-.02-.46-.06-.13-.58-1.4-.8-1.92-.21-.5-.43-.43-.58-.44h-.5c-.17 0-.46.07-.7.33-.24.26-.92.9-.92 2.2 0 1.3.95 2.56 1.08 2.74.13.17 1.87 2.85 4.54 4 .64.28 1.14.44 1.53.57.64.2 1.23.17 1.69.1.52-.08 1.55-.63 1.77-1.24.22-.61.22-1.13.15-1.24-.07-.11-.24-.17-.5-.3z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.9 2H22l-6.8 7.78L23 22h-6.5l-5.1-6.51L5.7 22H2.5l7.3-8.34L1.5 2H8l4.6 6.02L18.9 2zm-1.1 18h1.7L7.2 4h-1.8l12.4 16z" />
  </svg>
);

const MessengerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.06 2 11.07c0 2.84 1.45 5.37 3.72 7.03V22l3.57-1.96c.88.25 1.83.38 2.81.38 5.52 0 10-4.06 10-9.35S17.52 2 12 2zm.77 11.97l-2.55-2.72-4.98 2.72 5.48-5.93 2.5 2.72 4.96-2.72-5.41 5.93z" />
  </svg>
);

const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 2c.5 2.65 2.53 4.73 5 5v3.1c-1.87 0-3.62-.6-5-1.63v6.2a6.47 6.47 0 11-6.47-6.47c.25 0 .5.02.75.05v3.2a3.35 3.35 0 10 2.37 3.2V2h3.35z" />
  </svg>
);

const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M10.59 13.41a1 1 0 010-1.41l3.3-3.3a2 2 0 112.83 2.83l-1.24 1.24a1 1 0 101.41 1.41l1.24-1.24a4 4 0 10-5.66-5.66l-3.3 3.3a1 1 0 000 1.41 1 1 0 001.41 0z" />
    <path d="M13.41 10.59a1 1 0 010 1.41l-3.3 3.3a2 2 0 11-2.83-2.83l1.24-1.24a1 1 0 10-1.41-1.41l-1.24 1.24a4 4 0 105.66 5.66l3.3-3.3a1 1 0 000-1.41 1 1 0 00-1.41 0z" />
  </svg>
);

const YouTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.722 0 12c.029 6.277.488 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.54 4.385-8.816-.029-6.277-.488-8.549-4.385-8.816zm-10.615 12.737V8.079l6.238 3.528-6.238 3.314z" clipRule="evenodd" />
  </svg>
);

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, url, eventTitle }) => {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const fullUrl = useMemo(() => new URL(url, window.location.origin).toString(), [url]);
  const shareText = `Check out "${eventTitle}"`;
  const shareDescription = `${shareText} ${fullUrl}`;

  const shareOptions = [
    {
      name: 'Share from device',
      icon: <LinkIcon className="w-6 h-6 mr-2" />,
      action: async () => {
        if (navigator.share) {
          await navigator.share({ title: eventTitle, text: shareText, url: fullUrl }).catch(() => undefined);
        }
      },
      isNativeShare: true,
    },
    {
      name: 'WhatsApp',
      icon: <WhatsAppIcon className="w-6 h-6 mr-2" />,
      action: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareDescription)}`, '_blank'),
    },
    {
      name: 'Messenger',
      icon: <MessengerIcon className="w-6 h-6 mr-2" />,
      action: () => window.open(`https://www.messenger.com/share?link=${encodeURIComponent(fullUrl)}`, '_blank'),
    },
    {
      name: 'X',
      icon: <XIcon className="w-6 h-6 mr-2" />,
      action: () => window.open(`https://x.com/intent/post?text=${encodeURIComponent(shareDescription)}`, '_blank'),
    },
    {
      name: 'TikTok',
      icon: <TikTokIcon className="w-6 h-6 mr-2" />,
      action: () => window.open(`https://www.tiktok.com/share?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(eventTitle)}`, '_blank'),
    },
    {
      name: 'Facebook',
      icon: <FacebookIcon className="w-6 h-6 mr-2" />,
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank'),
    },
    {
      name: 'Gmail',
      icon: <GmailIcon className="w-6 h-6 mr-2" />,
      action: () => window.location.href = `mailto:?subject=${encodeURIComponent(`Check this out: ${eventTitle}`)}&body=${encodeURIComponent(`Hi,\n\n${shareText}\n\nYou can view it here: ${fullUrl}\n\nBest regards,`)}`,
    },
    {
      name: 'Instagram',
      icon: <InstagramIcon className="w-6 h-6 mr-2" />,
      action: () => {
        navigator.clipboard.writeText(fullUrl).then(() => setCopyStatus('Link copied for Instagram.'));
        // window.open(`https://www.instagram.com`, '_blank'); // Or link to profile
      }
    },
    {
      name: 'YouTube',
      icon: <YouTubeIcon className="w-6 h-6 mr-2" />,
      action: () => {
        window.open('https://youtube.com/yourchurchchannel', '_blank'); // Replace with actual channel
      }
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Share "{eventTitle}" via:</p>
        {shareOptions
          .filter(option => !option.isNativeShare || navigator.share)
          .map(option => (
            <Button
              key={option.name}
              onClick={option.action}
              variant="outline"
              className="w-full flex items-center justify-start !text-slate-700 hover:!bg-slate-100"
            >
              {option.icon}
              {option.name}
            </Button>
          ))}
        <div className="mt-4 pt-4 border-t">
             <label htmlFor="share-link" className="block text-xs font-medium text-slate-500 mb-1">Or copy link:</label>
             <input 
                type="text" 
                id="share-link"
                readOnly 
                value={fullUrl} 
                className="w-full p-2 border border-slate-300 rounded-md text-sm bg-slate-50"
                onFocus={(e) => e.target.select()}
            />
             <Button
                onClick={() => navigator.clipboard.writeText(fullUrl).then(() => setCopyStatus('Link copied.'))}
                variant="ghost"
                size="sm"
                className="mt-2"
            >
                Copy Link
            </Button>
            {copyStatus && <p className="text-xs text-slate-500 mt-2">{copyStatus}</p>}
        </div>
        <Button onClick={onClose} variant="primary" className="w-full mt-6">
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default ShareModal; 
