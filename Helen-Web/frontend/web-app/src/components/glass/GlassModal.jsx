import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/themeHooks';
import './GlassModal.css';

/**
 * GlassModal: Unified modal component with proper containment
 * - Blurred background overlay (NO glassmorphism on overlay)
 * - Content uses glassmorphism
 * - NO scrolling - fits within viewport bounds
 * - Consistent header pattern across all modals
 * 
 * Note: Camera glow removed - redundant since screen behind already has glow
 * 
 * Memoized to prevent re-renders when props haven't changed
 */
export const GlassModal = React.memo(({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    showCloseButton = true,
    size = 'medium', // 'small' | 'medium' | 'large'
}) => {
    const modalRef = useRef(null);
    const { currentTheme } = useTheme();

    // Handle escape key to close
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Click outside is handled by overlay onClick; no global listeners needed

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }, [isOpen]);

    // While a modal is open, add a class to the body so we can visually hide
    // the GlassFoundation chrome (border/blur) without unmounting it.
    useEffect(() => {
        if (!isOpen) return;
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div 
            className="glass-modal-overlay"
            style={{ background: currentTheme.backgroundColor }}
            onClick={onClose}
            role="presentation"
        >
            <div 
                ref={modalRef}
                className={`glass-modal glass-modal--${size} ${className}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {/* Modal Header */}
                {(title || showCloseButton) && (
                    <div className="glass-modal__header">
                        {title && (
                            <h2 id="modal-title" className="glass-modal__title">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button 
                                className="glass-modal__close"
                                onClick={onClose}
                                aria-label="Cerrar"
                                type="button"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Modal Content - NO scrolling */}
                <div className="glass-modal__content">
                    {children}
                </div>
            </div>
        </div>
    );
});

GlassModal.displayName = 'GlassModal';