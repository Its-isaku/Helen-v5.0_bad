import React from 'react';
import './GlassButton.css';

/**
 * GlassButton: accesible button with styling, supports icons and various sizes
 * Memoized to prevent unnecessary re-renders when props haven't changed
 */

export const GlassButton = React.memo(({
    children,
    onClick,
    variant = 'primary', // primary, secondary, icon
    size = 'medium', // small, medium, large
    disabled = false,
    ariaLabel,
    icon,
    className = '',
}) => {
    return (
        <button
            className={`glass-button glass-button--${variant} glass-button--${size} ${className}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
        >
            {icon && <span className="glass-button__icon" style={{ opacity: 0.5 }}>{icon}</span>}
            {children && <span className="glass-button__text">{children}</span>}
        </button>
    );
});