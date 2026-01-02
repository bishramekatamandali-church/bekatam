import React from 'react';

// Basic SVG icons for social media. Consider using a library like react-icons for more comprehensive options.
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const YouTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.722 0 12c.029 6.277.488 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.54 4.385-8.816-.029-6.277-.488-8.549-4.385-8.816zm-10.615 12.737V8.079l6.238 3.528-6.238 3.314z" clipRule="evenodd" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2.25c-2.813 0-3.174.012-4.287.06-1.098.048-1.852.228-2.517.506a4.428 4.428 0 00-1.605 1.605c-.278.665-.458 1.419-.506 2.517C2.013 8.826 2 9.187 2 12s.012 3.174.06 4.287c.048 1.098.228 1.852.506 2.517a4.428 4.428 0 001.605 1.605c.665.278 1.419.458 2.517.506 1.113.048 1.474.06 4.287.06s3.174-.012 4.287-.06c1.098-.048 1.852-.228 2.517-.506a4.428 4.428 0 001.605-1.605c.278-.665-.458-1.419-.506-2.517.048-1.113.06-1.474.06-4.287s-.012-3.174-.06-4.287c-.048-1.098-.228-1.852-.506-2.517a4.428 4.428 0 00-1.605-1.605c-.665-.278-1.419-.458-2.517-.506C15.174 2.013 14.813 2 12 2zm0 1.8c2.734 0 3.07.011 4.152.06 1.001.043 1.595.21 1.966.357.502.203.88.47 1.252.842.372.372.639.75.842 1.252.147.371.314.965.357 1.966.049 1.082.06 1.418.06 4.152s-.011 3.07-.06 4.152c-.043 1.001-.21 1.595-.357 1.966a3.017 3.017 0 01-.842 1.252c-.372.372-.75.639-1.252.842-.371.147-.965.314-1.966.357-1.082.049-1.418.06-4.152.06s-3.07-.011-4.152-.06c-1.001-.043-1.595-.21-1.966-.357a3.017 3.017 0 01-1.252-.842 3.017 3.017 0 01-.842-1.252c-.147-.371-.314-.965-.357-1.966C3.812 15.07 3.8 14.734 3.8 12s.011-3.07.06-4.152c.043-1.001.21-1.595.357-1.966.203-.502.47-.88.842-1.252.372-.372.75-.639 1.252-.842.371-.147.965-.314 1.966-.357C8.93 3.812 9.266 3.8 12 3.8zM12 7.2a4.8 4.8 0 100 9.6 4.8 4.8 0 000-9.6zm0 7.8a3 3 0 110-6 3 3 0 010 6zm5.25-8.25a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" clipRule="evenodd" />
    </svg>
);

// Add more icons as needed (Twitter, LinkedIn, etc.)

interface SocialLink {
  platform: 'facebook' | 'youtube' | 'instagram' | string; // Allow other string for future expansion
  url: string;
  label?: string; // Optional label for screen readers or tooltips
}

interface SocialIconsProps {
  links: SocialLink[];
  iconSize?: string; // e.g., "w-6 h-6"
  className?: string; // For the container
  iconClassName?: string; // For individual icons
}

const SocialIcons: React.FC<SocialIconsProps> = ({ 
    links, 
    iconSize = "w-6 h-6", 
    className = "flex space-x-4",
    iconClassName = "text-slate-500 hover:text-amber-500 transition-colors" 
}) => {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {links.map((link) => {
        let IconComponent;
        switch (link.platform.toLowerCase()) {
          case 'facebook': IconComponent = FacebookIcon; break;
          case 'youtube': IconComponent = YouTubeIcon; break;
          case 'instagram': IconComponent = InstagramIcon; break;
          default: IconComponent = null; // Or a generic link icon
        }

        if (!IconComponent) return null;

        return (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label || `Follow us on ${link.platform}`}
            className={iconClassName}
          >
            <IconComponent className={iconSize} />
          </a>
        );
      })}
    </div>
  );
};

export default SocialIcons;