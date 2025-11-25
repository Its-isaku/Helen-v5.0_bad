import React, { memo } from 'react';
import { GlassCard } from '../glass/GlassCard';
import './AlarmItem.css';

/**
 * AlarmItem Component
 * Individual alarm card in list view
 * 
 * Features:
 * - Large time display
 * - Label and repeat info
 * - Toggle switch
 * - Delete button in edit mode
 */
export const AlarmItem = memo(({ 
    alarm,
    isEditMode = false,
    onToggle,
    onEdit,
    onDelete
}) => {
    const { id, time, label, repeatDays, enabled } = alarm;


    // Format time for display
    const displayTime = `${time.hour}:${time.minute.toString().padStart(2, '0')}`;
    const displayPeriod = time.period;

    // Format repeat days for display
    const getRepeatText = () => {
        if (repeatDays.length === 0) return 'Nunca';
        if (repeatDays.length === 7) return 'Todos los días';
        const dayNames = ['Lun', 'Mar', 'Mier', 'Jue', 'Vie', 'Sab', 'Dom'];
        const activeDays = repeatDays.map(index => dayNames[index]);
        return activeDays.join(', ');
    };

    const handleToggle = (e) => {
        e.stopPropagation();
        onToggle?.(id);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete?.(id);
    };

    const handleClick = () => {
        // In edit mode, tapping opens edit modal
        if (isEditMode) {
            onEdit?.(alarm);
        }
        // In normal mode, do nothing (let toggle work independently)
    };

    return (
        <div 
            className={`alarm-item ${!enabled ? 'alarm-item--disabled' : ''} ${isEditMode ? 'alarm-item--edit-mode' : ''}`}
            onClick={handleClick}
            style={{ cursor: isEditMode ? 'pointer' : 'default' }}
        >
            <div className="alarm-item__card">
                {/* Left: Content Stack */}
                <div className="alarm-item__content">
                    {/* Line 1: Time + Period together */}
                    <div className="alarm-item__time">
                        {displayTime} {displayPeriod}
                    </div>
                    
                    {/* Line 2: Label */}
                    <div className="alarm-item__label">{label}</div>
                    
                    {/* Line 3: Repeat */}
                    <div className="alarm-item__repeat">Repetir: {getRepeatText()}</div>
                </div>

                {/* Right: Toggle/Delete */}
                <div className="alarm-item__action">
                    {isEditMode ? (
                        <button
                            className="alarm-item__delete-btn"
                            onClick={handleDelete}
                            aria-label="Eliminar alarma"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    ) : (
                        <button
                            className={`alarm-item__toggle ${enabled ? 'alarm-item__toggle--on' : ''}`}
                            onClick={handleToggle}
                            aria-label={enabled ? 'Desactivar alarma' : 'Activar alarma'}
                        >
                            <span className="alarm-item__toggle-thumb"></span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

AlarmItem.displayName = 'AlarmItem';