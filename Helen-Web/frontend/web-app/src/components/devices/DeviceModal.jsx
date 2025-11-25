import React, { useState } from 'react';
import { GlassModal } from '../glass/GlassModal';
import './DeviceModal.css';

/**
 * DeviceModal Component
 * Modal for adding or editing a device, with location and type selection.
 */
export const DeviceModal = ({ isOpen, onClose, onSave, device = null }) => {
    const [name, setName] = useState(device?.name || '');
    const [location, setLocation] = useState(device?.location || '');
    const [type, setType] = useState(device?.type || 'light');
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

    const locations = [
        'Cocina',
        'Sala de estar',
        'Habitación principal',
        'Habitación 2',
        'Baño',
        'Patio',
        'Garaje',
        'Oficina'
    ];

    const deviceTypes = [
        { id: 'light', icon: 'light_group', label: 'Luz' },
        { id: 'tv', icon: 'tv', label: 'TV' },
        { id: 'thermostat', icon: 'thermostat', label: 'Termostato' },
        { id: 'camera', icon: 'speed_camera', label: 'Cámara' },
        { id: 'speaker', icon: 'speaker', label: 'Bocina' },
        { id: 'fan', icon: 'mode_fan', label: 'Ventilador' },
        { id: 'lock', icon: 'lock', label: 'Cerradura' },
        { id: 'outlet', icon: 'power', label: 'Enchufe' },
        { id: 'electrodomestic', icon: 'coffee_maker', label: 'Electrodoméstico' },
        { id: 'other', icon: 'home_iot_device', label: 'Otro' }
    ];

    const deviceNames = {
        light: ['Luz 1', 'Luz 2', 'Luz 3', 'Lámpara'],
        tv: ['TV 1', 'TV 2', 'Smart TV'],
        thermostat: ['Termostato', 'Clima'],
        camera: ['Cámara', 'Cámara 1', 'Cámara 2'],
        speaker: ['Bocina', 'Altavoz'],
        fan: ['Ventilador', 'Ventilador de techo'],
        lock: ['Cerradura', 'Cerradura principal', 'Timbre'],
        outlet: ['Enchufe', 'Toma de corriente'],
        electrodomestic: ['Cafetera', 'Microondas', 'Refrigerador'],
        other: ['Dispositivo 1', 'Dispositivo 2']
    };

    // Save device and close modal
    const handleSave = () => {
        if (!name || !location || !type) return;

        const deviceData = {
            id: device?.id || Date.now(),
            name,
            location,
            type,
            enabled: device?.enabled ?? true
        };

        onSave(deviceData);
        onClose();
    };

    // Handle location selection
    const handleLocationSelect = (loc) => {
        setLocation(loc);
        setIsLocationDropdownOpen(false);
    };

    // Handle device type selection
    const handleTypeSelect = (typeId) => {
        setType(typeId);
        // Set default name for this type if name is empty
        if (!name) {
            setName(deviceNames[typeId][0]);
        }
    };

    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            size="medium"
            showCloseButton={false}
        >
            <div className="device-modal">
                {/* Modal header with Close and Save buttons */}
                <div className="device-modal__header">
                    <button
                        type="button"
                        className="device-modal__header-btn"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <h3 className="device-modal__title">
                        {device ? 'Editar Dispositivo' : 'Agregar Dispositivo'}
                    </h3>
                    <button
                        type="button"
                        className="device-modal__header-btn device-modal__header-btn--save"
                        onClick={handleSave}
                        disabled={!name || !location || !type}
                        aria-label="Guardar"
                    >
                        <span className="material-symbols-outlined">check</span>
                    </button>
                </div>
                {/* Location selector */}
                <div className="device-modal__section">
                    <label className="device-modal__label">Ubicación del dispositivo</label>
                    <div className="device-modal__dropdown">
                        <button
                            type="button"
                            className="device-modal__dropdown-trigger"
                            onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                        >
                            <span>{location || 'Seleccionar ubicación'}</span>
                            <span className="material-icons-outlined device-modal__dropdown-arrow">
                                {isLocationDropdownOpen ? 'expand_less' : 'expand_more'}
                            </span>
                        </button>

                        {isLocationDropdownOpen && (
                            <div className="device-modal__dropdown-menu">
                                {locations.map((loc) => (
                                    <button
                                        key={loc}
                                        type="button"
                                        className={`device-modal__dropdown-option ${location === loc ? 'device-modal__dropdown-option--active' : ''}`}
                                        onClick={() => handleLocationSelect(loc)}
                                    >
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Device type selector */}
                <div className="device-modal__section">
                    <label className="device-modal__label">Tipo de dispositivo</label>
                    <div className="device-modal__types">
                        {deviceTypes.map((deviceType) => (
                            <button
                                key={deviceType.id}
                                type="button"
                                className={`device-modal__type ${type === deviceType.id ? 'device-modal__type--active' : ''}`}
                                onClick={() => handleTypeSelect(deviceType.id)}
                                aria-label={deviceType.label}
                            >
                                <span className="material-symbols-outlined">{deviceType.icon}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Device name selector */}
                <div className="device-modal__section">
                    <label className="device-modal__label">Nombre del dispositivo</label>
                    <div className="device-modal__names">
                        {deviceNames[type]?.map((deviceName) => (
                            <button
                                key={deviceName}
                                type="button"
                                className={`device-modal__name-btn ${name === deviceName ? 'device-modal__name-btn--active' : ''}`}
                                onClick={() => setName(deviceName)}
                            >
                                {deviceName}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </GlassModal>
    );
};