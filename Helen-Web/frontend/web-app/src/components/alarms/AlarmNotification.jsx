import React from 'react';
import { GlassModal } from '../glass/GlassModal';
import './AlarmNotification.css';

/**
 * AlarmNotification - Modal displayed when an alarm is triggered.
 * Shows alarm details and provides a button to dismiss or stop the alarm.
 */
export const AlarmNotification = ({ isOpen, alarm, onDismiss }) => {
    if (!alarm) return null;

    // Format time for display
    const displayTime = alarm.time 
        ? (typeof alarm.time === 'string' 
            ? alarm.time 
            : `${alarm.time.hour}:${alarm.time.minute.toString().padStart(2, '0')} ${alarm.time.period}`)
        : '';

    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onDismiss}
            title="Alarma"
            size="medium"
        >
            <div className="alarm-notification">
                {/* Alarm Icon */}
                <div className="alarm-notification__icon-container">
                    <span className="material-icons-outlined alarm-notification__icon">
                        alarm
                    </span>
                </div>

                {/* Alarm Time */}
                {displayTime && (
                    <div className="alarm-notification__time">
                        {displayTime}
                    </div>
                )}

                {/* Alarm Label */}
                {alarm.label && alarm.label !== 'No etiqueta' && (
                    <div className="alarm-notification__label">
                        {alarm.label}
                    </div>
                )}

                {/* Dismiss Button */}
                <button 
                    className="alarm-notification__dismiss-btn"
                    onClick={onDismiss}
                    autoFocus
                >
                    <span className="material-icons-outlined">notifications_off</span>
                    Apagar Alarma
                </button>
            </div>
        </GlassModal>
    );
};
