import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string; // Added for HTML id attribute
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, id }) => {
  const baseClasses = "bg-white shadow-md rounded-xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1";
  const clickableClasses = onClick ? "cursor-pointer" : "";

  return (
    <div id={id} className={`${baseClasses} ${clickableClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}
export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-6 border-b border-slate-200 ${className}`}>
    {children}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-6 ${className}`}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}
export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-6 bg-slate-50 border-t border-slate-200 ${className}`}>
    {children}
  </div>
);


export default Card;