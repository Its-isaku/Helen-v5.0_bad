import React from 'react';
import './GlassCard.css';

/**
 * GlassCard: card component with glassmorphism for content sections
 * used in bento grind and content layouts
 * Memoized to prevent unnecessary re-renders in grid layouts
 */

export const GlassCard = React.memo(({
    title,
    children,
    onClick,
    className = '',
    hoverable = false,
    ariaLabel,
}) => {
    return (
        <div
            className={`glass-card ${hoverable ? 'glass-card--hoverable' : ''} ${className}`}
            onClick={onClick}
            aria-label={ariaLabel}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {title && <h3 className="glass-card__title">{title}</h3>}
            <div className="glass-card__content">{children}</div>
        </div>
    );
});