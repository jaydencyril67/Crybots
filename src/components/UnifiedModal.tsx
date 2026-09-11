import React from 'react';
import './UnifiedModal.css';

interface UnifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerBackground?: string;
  children: React.ReactNode;
  maxWidth?: number;
  minWidth?: number;
}

const UnifiedModal: React.FC<UnifiedModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  headerBackground,
  children,
  maxWidth = 320,
  minWidth = 280
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="unified-modal-overlay"
        onClick={onClose}
      >
        <div 
          className="unified-modal-container"
          style={{
            minWidth,
            maxWidth
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient background */}
          <div 
            className="unified-modal-header"
            style={{
              background: headerBackground || 'linear-gradient(135deg, var(--primary), var(--secondary))'
            }}
          >
            <h2 className="unified-modal-title">
              {title}
            </h2>
            {subtitle && (
              <div className="unified-modal-subtitle">
                {subtitle}
              </div>
            )}
          </div>

          {/* Modal content */}
          <div className="unified-modal-content">
            {children}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            transform: translateY(30px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default UnifiedModal;

