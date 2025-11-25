import React from 'react';
import './GlassContainer.css';

/**
 * glass container (foundation): reusable glassmorphism container component
 */
export const GlassContainer = ({
    children,
    className = '',
    padding = '20px',
    style = {},
    onClick,
    ariaLabel,
}) => {
    return (
        <div
            className={`glass-container ${className}`}
            style={{ padding, ...style }}
            onClick={onClick}
            aria-label={ariaLabel}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
};