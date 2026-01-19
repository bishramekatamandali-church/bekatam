import React, { ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  overlayClassName?: string;
  panelClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  overlayClassName,
  panelClassName,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
      contentRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-screen-2xl h-[94vh]",
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${
        overlayClassName || ""
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
          className={`bg-white rounded-2xl shadow-xl w-full ${
            sizeClasses[size]
          } m-4 opacity-0 animate-modalShow flex flex-col transform-gpu ${
            size === "full" ? "max-h-[94vh]" : "max-h-[85vh]"
          } ${panelClassName || ""}`}
          onClick={(e) => e.stopPropagation()}
        >
        {(title || typeof onClose === "function") && (
          <div className="p-6 pb-4 border-b border-slate-200 flex-shrink-0 relative">
            {title && (
              <h2
                id="modal-title"
                className="text-2xl font-semibold text-slate-800"
              >
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-100"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <div
          ref={contentRef}
          tabIndex={0}
          onKeyDown={(event) => {
            const target = event.target as HTMLElement;
            const isEditable =
              target.isContentEditable ||
              ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
            if (!contentRef.current || isEditable) return;

            const scrollStep = 48;
            if (event.key === "ArrowDown") {
              contentRef.current.scrollBy({ top: scrollStep, behavior: "smooth" });
              event.preventDefault();
            } else if (event.key === "ArrowUp") {
              contentRef.current.scrollBy({ top: -scrollStep, behavior: "smooth" });
              event.preventDefault();
            } else if (event.key === "PageDown") {
              contentRef.current.scrollBy({ top: contentRef.current.clientHeight * 0.9, behavior: "smooth" });
              event.preventDefault();
            } else if (event.key === "PageUp") {
              contentRef.current.scrollBy({ top: -contentRef.current.clientHeight * 0.9, behavior: "smooth" });
              event.preventDefault();
            }
          }}
          className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100 focus:outline-none"
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes modalShow {
          to {
            opacity: 1;
          }
        }
        .animate-modalShow {
          animation: modalShow 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;
  
