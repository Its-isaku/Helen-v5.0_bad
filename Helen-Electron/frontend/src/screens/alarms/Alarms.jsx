import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGestureNavigation } from '../../contexts/gesture/gestureNavigationHooks';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { GlassCard } from '../../components/glass/GlassCard';
import { AlarmItem } from '../../components/alarms/AlarmItem';
import { AlarmModal } from '../../components/alarms/AlarmModal';
import { ROUTES } from '../../config/constants';
import { alarmService } from '../../services/features/alarmService';
import { convertTo24Hour, convertTo12Hour } from '../../utils/timeUtils';
import './Alarms.css';

const MAX_ALARMS = 10;

/**
 * Alarms Screen
 * Manage up to 10 alarms with time, label, and repeat settings
 * 
 * Features:
 * - Add/Edit/Delete alarms
 * - Toggle alarms on/off
 * - Edit mode for bulk operations
 * - 10 alarm limit
 */

const Alarms = () => {
    const navigate = useNavigate();
    const { pendingModalGesture, clearPendingModal } = useGestureNavigation();
    
    // State
    const [alarms, setAlarms] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlarm, setEditingAlarm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Keep a ref to avoid recreating callbacks based on array deps
    const alarmsRef = useRef(alarms);
    useEffect(() => {
        alarmsRef.current = alarms;
    }, [alarms]);

    // Handler functions (declared before useEffect to avoid initialization errors)
    const handleClose = useCallback(() => {
        navigate(ROUTES.HOME);
    }, [navigate]);

    const handleEdit = useCallback(() => {
        setIsEditMode(prev => !prev);
    }, []);

    const handleAdd = useCallback(() => {
        if (alarms.length >= MAX_ALARMS) return;
        setEditingAlarm(null);
        setIsModalOpen(true);
    }, [alarms.length]);

    // Handle gesture actions
    useEffect(() => {
        if (pendingModalGesture?.action) {
            if (pendingModalGesture.action === 'add-item') {
                handleAdd();
                clearPendingModal();
            } else if (pendingModalGesture.action === 'edit-item') {
                handleEdit();
                clearPendingModal();
            }
        }
    }, [pendingModalGesture, handleAdd, handleEdit, clearPendingModal]);

    // Fetch alarms on mount
    useEffect(() => {
        setLoading(true);
        setError(null);

        alarmService.fetchAlarms()
            .then(response => {
                const data = response.data || response;
                // Convert time strings from backend to 12-hour objects for display
                const alarmsWithConvertedTime = (Array.isArray(data) ? data : []).map(alarm => ({
                    ...alarm,
                    time: convertTo12Hour(alarm.time),
                    repeatDays: alarm.days || [] // Map days to repeatDays
                }));
                setAlarms(alarmsWithConvertedTime);
                setError(null);
            })
            .catch((err) => {
                console.error('Failed to fetch alarms:', err);
                setError('No se pudieron cargar las alarmas. Verifica tu conexión.');
                setAlarms([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleEditAlarm = useCallback((alarm) => {
        // In edit mode, tapping alarm opens edit modal
        // In normal mode, do nothing (let toggle switch work)
        if (isEditMode) {
            console.log('Editing alarm:', alarm);
            // Alarm already has time in 12-hour format and repeatDays mapped
            setEditingAlarm({
                ...alarm,
                repeatDays: alarm.repeatDays || alarm.days || [] // Ensure repeatDays is set
            });
            setIsModalOpen(true);
        }
    }, [isEditMode]);

    const handleToggle = useCallback(async (id) => {
        const snapshot = alarmsRef.current;

        try {
            // Optimistic update
            setAlarms(prev => prev.map(alarm =>
                alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
            ));

            await alarmService.toggleAlarm(id);
            setError(null);
        } catch (err) {
            // Rollback on error
            console.error('Failed to toggle alarm:', err);
            setAlarms(snapshot);
            setError('Error al cambiar el estado de la alarma');
        }
    }, []);

    const handleDelete = useCallback(async (id) => {
        const snapshot = alarmsRef.current;

        try {
            // Optimistic update
            setAlarms(prev => prev.filter(alarm => alarm.id !== id));

            await alarmService.deleteAlarm(id);
            setError(null);
        } catch (err) {
            // Rollback on error
            console.error('Failed to delete alarm:', err);
            setAlarms(snapshot);
            setError('Error al eliminar la alarma');
        }
    }, []);

    const handleSave = async (alarmData) => {
        try {
            setLoading(true);
            setError(null);

            console.log('Alarms.jsx received alarmData:', alarmData);

            // Convert time object to HH:MM string format (24-hour)
            const timeString = convertTo24Hour(alarmData.time);
            console.log('Converted time to 24h:', timeString);
            if (alarmData.id) {
                // Update existing alarm
                const updates = {
                    time: timeString,
                    label: alarmData.label,
                    days: alarmData.repeatDays,
                    enabled: alarmData.enabled,
                };

                console.log('Updating alarm:', alarmData.id, updates);
                const response = await alarmService.updateAlarm(alarmData.id, updates);
                const updated = response.data || response;
                
                // Convert time back to 12-hour format for display
                const updatedWithConvertedTime = {
                    ...updated,
                    time: convertTo12Hour(updated.time),
                    repeatDays: updated.days || []
                };

                setAlarms(prev => prev.map(alarm =>
                    alarm.id === alarmData.id ? updatedWithConvertedTime : alarm
                ));
            } else {
                // Add new alarm
                console.log('Creating new alarm with time:', timeString);
                const response = await alarmService.createAlarm({
                    time: timeString,
                    label: alarmData.label,
                    days: alarmData.repeatDays
                });

                const created = response.data || response;
                
                // Convert time back to 12-hour format for display
                const createdWithConvertedTime = {
                    ...created,
                    time: convertTo12Hour(created.time),
                    repeatDays: created.days || []
                };
                
                setAlarms(prev => [...prev, createdWithConvertedTime]);
            }

            setError(null);
        } catch (err) {
            console.error('Failed to save alarm:', err);
            setError('Error al guardar la alarma');
        } finally {
            setIsModalOpen(false);
            setEditingAlarm(null);
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAlarm(null);
    };

    const atMaxAlarms = alarms.length >= MAX_ALARMS;

    return (
        <div className="alarms-screen">
            <ScreenHeader 
                title="Mis Alarmas"
                variant="enhanced"
                onClose={handleClose}
                onEdit={handleEdit}
                onAdd={handleAdd}
                showEditButton={alarms.length > 0}
                showAddButton={!atMaxAlarms}
                isEditMode={isEditMode}
            />

            {loading && (
                <div className="alarms-empty">
                    <GlassCard>
                        <div className="alarms-empty__content">
                            <span className="material-icons-outlined alarms-empty__icon">hourglass_empty</span>
                            <p className="alarms-empty__text">Cargando alarmas...</p>
                        </div>
                    </GlassCard>
                </div>
            )}

            {error && (
                <div className="alarms-empty">
                    <GlassCard>
                        <div className="alarms-empty__content">
                            <span className="material-icons-outlined alarms-empty__icon">error</span>
                            <p className="alarms-empty__text">{error}</p>
                        </div>
                    </GlassCard>
                </div>
            )}

            {!loading && !error && alarms.length === 0 && (
                <div className="alarms-empty">
                    <GlassCard onClick={handleAdd} style={{ cursor: 'pointer' }}>
                        <div className="alarms-empty__content">
                            <span className="material-icons-outlined alarms-empty__icon">alarm_add</span>
                            <p className="alarms-empty__text">Sin Alarmas</p>
                        </div>
                    </GlassCard>
                </div>
            )}

            {!loading && !error && alarms.length > 0 && (
                <div className="alarms-list">
                    {alarms.map(alarm => (
                        <AlarmItem
                            key={alarm.id}
                            alarm={alarm}
                            isEditMode={isEditMode}
                            onToggle={handleToggle}
                            onEdit={handleEditAlarm}
                            onDelete={handleDelete}
                        />
                    ))}

                    {atMaxAlarms && (
                        <div className="alarms-max-message">
                            <GlassCard>
                                <p className="alarms-max-message__text">
                                    <span className="material-icons-outlined">info</span>
                                    Máximo de {MAX_ALARMS} alarmas alcanzado
                                </p>
                            </GlassCard>
                        </div>
                    )}
                </div>
            )}

            <AlarmModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                alarm={editingAlarm}
                onSave={handleSave}
            />
        </div>
    );
};

export default Alarms;
