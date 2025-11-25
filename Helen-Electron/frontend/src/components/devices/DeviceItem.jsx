import React, { memo } from 'react';
import './DeviceItem.css';

/**
 * DeviceItem Component
 * Compact device card in grid view
 * 
 * Features:
 * - Device icon and name
 * - Location display
 * - Toggle switch
 * - Delete button in edit mode
 */
export const DeviceItem = memo(({ 
    device,
    isEditMode = false,
    onToggle,
    onEdit,
    onDelete
}) => {
    const { id, name, location, type, enabled } = device;

    // Icon mapping for device types
    const getDeviceIcon = () => {
        const icons = {
            light: 'light_group',
            tv: 'tv',
            thermostat: 'thermostat',
            camera: 'speed_camera',
            speaker: 'speaker',
            fan: 'mode_fan',
            lock: 'lock',
            outlet: 'power',
            electrodomestic: 'coffee_maker',
            other: 'home_iot_device'
        };
        return icons[type] || 'home_iot_device';
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
            onEdit?.(device);
        }
    };

    return (
        <div 
            className={`device-item ${!enabled ? 'device-item--disabled' : ''} ${isEditMode ? 'device-item--edit-mode' : ''}`}
            onClick={handleClick}
            style={{ cursor: isEditMode ? 'pointer' : 'default' }}
        >
            <div className="device-item__card">
                {/* Icon */}
                <div className="device-item__icon">
                    <span className="material-symbols-outlined">{getDeviceIcon()}</span>
                </div>

                {/* Content */}
                <div className="device-item__content">
                    <div className="device-item__name">{name}</div>
                    <div className="device-item__location">{location}</div>
                </div>

                {/* Action */}
                <div className="device-item__action">
                    {isEditMode ? (
                        <button
                            className="device-item__delete-btn"
                            onClick={handleDelete}
                            aria-label="Eliminar dispositivo"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    ) : (
                        <button
                            className={`device-item__toggle ${enabled ? 'device-item__toggle--on' : ''}`}
                            onClick={handleToggle}
                            aria-label={enabled ? 'Desactivar dispositivo' : 'Activar dispositivo'}
                        >
                            <span className="device-item__toggle-thumb"></span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

DeviceItem.displayName = 'DeviceItem';