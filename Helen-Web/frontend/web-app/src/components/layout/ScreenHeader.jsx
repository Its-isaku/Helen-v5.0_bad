import React from 'react';
import { GlassButton } from '../glass/GlassButton';
import './ScreenHeader.css';

/**
 * ScreenHeader Component
 * Flexible header that handles different screen layouts
 * 
 * Variants:
 * - basic: Title centered, close button (X) on right
 * - enhanced: Title centered, edit button on left, add + close buttons on right
 * - settings: Title on left, close button (X) on right
 */
export const ScreenHeader = React.memo(({
    title,
    variant = 'basic', // 'basic' | 'enhanced' | 'settings'
    onClose,
    onEdit,
    onAdd,
    onRefresh,
    showEditButton = false,
    showAddButton = false,
    showRefreshButton = false,
    addButtonDisabled = false,
    isEditMode = false, // NEW: Track edit mode state
    className = '',
}) => {
    return (
        <div className={`screen-header screen-header--${variant} ${className}`}>
            {/* Left Section */}
            <div className="screen-header__left">
                {variant === 'enhanced' && showEditButton && (
                    <GlassButton
                        variant="text"
                        onClick={onEdit}
                        ariaLabel={isEditMode ? "Listo" : "Editar"}
                    >
                        {isEditMode ? "Listo" : "Editar"}
                    </GlassButton>
                )}
                {variant === 'settings' && (
                    <h1 className="screen-title">{title}</h1>
                )}
                {showRefreshButton && (
                    <GlassButton
                        variant="icon"
                        onClick={onRefresh}
                        ariaLabel="Actualizar"
                    >
                        <span className="material-icons-outlined">refresh</span>
                    </GlassButton>
                )}
            </div>

            {/* Center Section */}
            {variant !== 'settings' && (
                <h1 className="screen-title">{title}</h1>
            )}

            {/* Right Section */}
            <div className="screen-header__right">
                {variant === 'enhanced' && showAddButton && (
                    <GlassButton
                        variant="icon"
                        onClick={onAdd}
                        disabled={addButtonDisabled}
                        ariaLabel="Agregar"
                    >
                        <span className="material-icons-outlined">add</span>
                    </GlassButton>
                )}
                <GlassButton
                    variant="icon"
                    onClick={onClose}
                    ariaLabel="Cerrar"
                >
                    <span className="material-icons-outlined">close</span>
                </GlassButton>
            </div>
        </div>
    );
});

ScreenHeader.displayName = 'ScreenHeader';
