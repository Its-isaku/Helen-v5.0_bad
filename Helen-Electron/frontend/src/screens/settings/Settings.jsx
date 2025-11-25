import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/glass/GlassCard';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ROUTES } from '../../config/constants';
import './Settings.css';

/**
 * Settings Screen
 * System configuration and information
 */
const Settings = () => {
    const navigate = useNavigate();
    const [wifiEnabled, setWifiEnabled] = useState(true);

    // Mock system data
    const systemData = {
        devices: 5,
        status: 'Activo',
        version: '5.0.0'
    };

    const handleClose = () => {
        navigate(ROUTES.HOME);
    };

    const handleWifiToggle = () => {
        setWifiEnabled(!wifiEnabled);
    };

    const handleHelp = () => {
        // TODO: Navigate to help screen or open help modal
        console.log('Help clicked');
    };

    const handleSystemStatus = () => {
        // TODO: Navigate to detailed system status
        console.log('System status clicked');
    };

    return (
        <div className="settings-screen">
            <ScreenHeader
                title="Ajustes"
                variant="settings"
                onClose={handleClose}
            />

            <div className="settings-content">
                {/* Top Row: WiFi and Help */}
                <div className="settings-row">
                    {/* WiFi Card */}
                    <GlassCard className="settings-card settings-card--wifi">
                        <div className="settings-card__content">
                            <span className="settings-card__label">Wi-Fi</span>
                            <button
                                className={`settings-toggle ${wifiEnabled ? 'settings-toggle--on' : ''}`}
                                onClick={handleWifiToggle}
                                aria-label={wifiEnabled ? 'Desactivar Wi-Fi' : 'Activar Wi-Fi'}
                            >
                                <span className="settings-toggle__thumb"></span>
                            </button>
                        </div>
                    </GlassCard>

                    {/* Help Card */}
                    <GlassCard 
                        className="settings-card settings-card--help"
                        onClick={handleHelp}
                        hoverable
                    >
                        <div className="settings-card__content">
                            <span className="settings-card__label">Ayuda</span>
                            <span className="material-symbols-outlined settings-card__icon">
                                help_outline
                            </span>
                        </div>
                    </GlassCard>
                </div>

                {/* System Status Card */}
                <GlassCard 
                    className="settings-card settings-card--system"
                    onClick={handleSystemStatus}
                    hoverable
                >
                    <div className="settings-system">
                        <div className="settings-system__header">
                            <span className="settings-system__title">Estado del Sistema</span>
                            <span className="material-symbols-outlined settings-system__icon">
                                info
                            </span>
                        </div>
                        
                        <div className="settings-system__info">
                            <div className="settings-system__item">
                                <span className="settings-system__label">DISPOSITIVOS</span>
                                <span className="settings-system__value">{systemData.devices} conectados</span>
                            </div>
                            
                            <div className="settings-system__item">
                                <span className="settings-system__label">ESTADO</span>
                                <span className="settings-system__value">{systemData.status}</span>
                            </div>
                            
                            <div className="settings-system__item">
                                <span className="settings-system__label">VERSIÓN</span>
                                <span className="settings-system__value">{systemData.version}</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default Settings;
