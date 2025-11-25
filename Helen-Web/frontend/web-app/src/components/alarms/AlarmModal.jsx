import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GlassModal } from '../glass/GlassModal';
import './AlarmModal.css';

const DAYS = [
    { short: 'L', full: 'Lunes' },
    { short: 'M', full: 'Martes' },
    { short: 'M', full: 'Miércoles' },
    { short: 'J', full: 'Jueves' },
    { short: 'V', full: 'Viernes' },
    { short: 'S', full: 'Sábado' },
    { short: 'D', full: 'Domingo' }
];

const LABELS = [
    'No etiqueta',
    'Despertar',
    'Medicamento',
    'Reunión',
    'Ejercicio',
    'Comida',
    'Trabajo',
    'Dormir',
    'Otro'
];

/**
 * AlarmModal - Compact modal for adding/editing alarms with touch-friendly spinners.
 * No scrolling: all content is always visible.
 */
export const AlarmModal = ({ isOpen, onClose, alarm, onSave }) => {
    const [alarmId, setAlarmId] = useState(alarm?.id);
    const [time, setTime] = useState(alarm?.time || { hour: 11, minute: 0, period: 'p.m.' });
    const [repeatDays, setRepeatDays] = useState(alarm?.repeatDays || []);
    const [label, setLabel] = useState(alarm?.label || 'No etiqueta');
    const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
    
    // Track the last alarm ID to detect when editing a different alarm
    const lastAlarmIdRef = useRef(null);

    // Update state when alarm prop changes or when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            // Modal closed, reset the ref
            lastAlarmIdRef.current = null;
            return;
        }

        const currentAlarmId = alarm?.id || null;
        
        // Only update if this is a different alarm or a new alarm
        if (currentAlarmId !== lastAlarmIdRef.current) {
            lastAlarmIdRef.current = currentAlarmId;
            
            if (alarm) {
                // Editing an existing alarm
                setAlarmId(alarm.id);
                setTime(alarm.time || { hour: 11, minute: 0, period: 'p.m.' });
                setRepeatDays(alarm.repeatDays || []);
                setLabel(alarm.label || 'No etiqueta');
            } else {
                // Creating a new alarm
                setAlarmId(null);
                setTime({ hour: 11, minute: 0, period: 'p.m.' });
                setRepeatDays([]);
                setLabel('No etiqueta');
            }
            setIsLabelDropdownOpen(false);
        }
    }, [alarm, isOpen]); // Re-run when alarm or isOpen changes

    // Handle hour spinner change
    const handleHourChange = useCallback((delta) => {
        setTime(prev => {
            let newHour = prev.hour + delta;
            if (newHour > 12) newHour = 1;
            if (newHour < 1) newHour = 12;
            return { ...prev, hour: newHour };
        });
    }, []);

    // Handle minute spinner change
    const handleMinuteChange = useCallback((delta) => {
        setTime(prev => {
            let newMinute = prev.minute + delta;
            if (newMinute > 59) newMinute = 0;
            if (newMinute < 0) newMinute = 59;
            return { ...prev, minute: newMinute };
        });
    }, []);

    // Toggle AM/PM period
    const togglePeriod = useCallback(() => {
        setTime(prev => ({ ...prev, period: prev.period === 'a.m.' ? 'p.m.' : 'a.m.' }));
    }, []);

    // Toggle repeat day selection
    const toggleDay = useCallback((index) => {
        setRepeatDays(prev => 
            prev.includes(index) 
                ? prev.filter(d => d !== index)
                : [...prev, index].sort()
        );
    }, []);

    // Save alarm and close modal
    const handleSave = useCallback(() => {
        const alarmData = {
            time,
            repeatDays,
            label,
            enabled: alarm?.enabled ?? true
        };
        
        // Only include id if we're editing an existing alarm
        if (alarmId) {
            alarmData.id = alarmId;
        }
        
        onSave(alarmData);
        onClose();
    }, [time, repeatDays, label, alarmId, alarm?.enabled, onSave, onClose]);

    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            size="small"
            showCloseButton={false}
        >
            <div className="alarm-modal">
                {/* Modal Header */}
                <div className="alarm-modal__header">
                    <button 
                        className="alarm-modal__btn alarm-modal__btn--cancel"
                        onClick={onClose}
                        aria-label="Cancelar"
                    >
                        <span className="material-icons-outlined">close</span>
                    </button>
                    <h2 className="alarm-modal__title">
                        {alarm ? 'Editar Alarma' : 'Agregar Alarma'}
                    </h2>
                    <button 
                        className="alarm-modal__btn alarm-modal__btn--save"
                        onClick={handleSave}
                        aria-label="Guardar"
                    >
                        <span className="material-icons-outlined">check</span>
                    </button>
                </div>

                {/* Time Input - Touch-Friendly Spinners */}
                <div className="alarm-modal__time">
                    <div className="alarm-modal__time-spinner">
                        <button 
                            className="alarm-modal__time-arrow"
                            onClick={() => handleHourChange(1)}
                            aria-label="Incrementar hora"
                        >
                            <span className="material-icons-outlined">expand_less</span>
                        </button>
                        <div className="alarm-modal__time-value">
                            {time.hour.toString().padStart(2, '0')}
                        </div>
                        <button 
                            className="alarm-modal__time-arrow"
                            onClick={() => handleHourChange(-1)}
                            aria-label="Decrementar hora"
                        >
                            <span className="material-icons-outlined">expand_more</span>
                        </button>
                    </div>

                    <span className="alarm-modal__time-separator">:</span>

                    <div className="alarm-modal__time-spinner">
                        <button 
                            className="alarm-modal__time-arrow"
                            onClick={() => handleMinuteChange(1)}
                            aria-label="Incrementar minuto"
                        >
                            <span className="material-icons-outlined">expand_less</span>
                        </button>
                        <div className="alarm-modal__time-value">
                            {time.minute.toString().padStart(2, '0')}
                        </div>
                        <button 
                            className="alarm-modal__time-arrow"
                            onClick={() => handleMinuteChange(-1)}
                            aria-label="Decrementar minuto"
                        >
                            <span className="material-icons-outlined">expand_more</span>
                        </button>
                    </div>

                    <button 
                        className="alarm-modal__period"
                        onClick={togglePeriod}
                        aria-label="Cambiar período"
                    >
                        {time.period}
                    </button>
                </div>

                {/* Repeat Days - Compact */}
                <div className="alarm-modal__section">
                    <div className='alarm-modal__setion'>
                        <label className="alarm-modal__label">Repetir</label>
                        <div className="alarm-modal__days">
                            {DAYS.map((day, index) => (
                                <button
                                    key={index}
                                    className={`alarm-modal__day ${repeatDays.includes(index) ? 'alarm-modal__day--active' : ''}`}
                                    onClick={() => toggleDay(index)}
                                    aria-label={day.full}
                                    title={day.full}
                                >
                                    {day.short}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Label Selector - Custom Dropdown that opens upward */}
                <div className="glass-card alarm-modal__section">
                    <label className="alarm-modal__label">Etiqueta</label>
                    <div className="alarm-modal__dropdown">
                        <button
                            className="alarm-modal__dropdown-trigger"
                            onClick={() => setIsLabelDropdownOpen(!isLabelDropdownOpen)}
                            aria-label="Seleccionar etiqueta"
                        >
                            <span>{label}</span>
                            <span className="material-icons-outlined alarm-modal__dropdown-arrow">
                                {isLabelDropdownOpen ? 'expand_less' : 'expand_more'}
                            </span>
                        </button>
                        
                        {isLabelDropdownOpen && (
                            <div className="alarm-modal__dropdown-menu">
                                {LABELS.map(l => (
                                    <button
                                        key={l}
                                        className={`alarm-modal__dropdown-option ${label === l ? 'alarm-modal__dropdown-option--active' : ''}`}
                                        onClick={() => {
                                            setLabel(l);
                                            setIsLabelDropdownOpen(false);
                                        }}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </GlassModal>
    );
};