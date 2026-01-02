

import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[999] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} m-4 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow flex flex-col max-h-[85vh]`}
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        {/* Header Section (Non-scrollable) */}
        {(title || typeof onClose === 'function') && (
            <div className="p-6 pb-4 border-b border-slate-200 flex-shrink-0 relative">
            {title && (
                <h2 id="modal-title" className="text-2xl font-semibold text-slate-800">
                {title}
                </h2>
            )}
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-100"
                aria-label="Close modal"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            </div>
        )}
        
        {/* Scrollable Content Area */}
        <div className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes modalShow {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalShow {
          animation: modalShow 0.3s forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;