import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/glass/GlassCard';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { ROUTES } from '../config/constants';
import { deviceService } from '../services/deviceService';
import { wifiService } from '../services/wifiService';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [wifiEnabled, setWifiEnabled] = useState(false);
    const [systemData, setSystemData] = useState({
        devices: 0,
        status: 'Cargando...',
        version: '5.0.2'
    });

    useEffect(() => {
        loadSystemData();
        loadWifiStatus();
    }, []);

    const loadSystemData = async () => {
        try {
            const devices = await deviceService.getAll();
            const connectedDevices = devices.filter(d => d.connected).length;
            
            setSystemData({
                devices: connectedDevices,
                status: connectedDevices > 0 ? 'Activo' : 'Sin dispositivos',
                version: '5.0.2'
            });
        } catch (error) {
            console.error('Error loading system data:', error);
            setSystemData({
                devices: 0,
                status: 'Error',
                version: '5.0.2'
            });
        }
    };

    const loadWifiStatus = async () => {
        try {
            const status = await wifiService.getConnectionStatus();
            setWifiEnabled(status.connected || false);
        } catch (error) {
            console.error('Error loading WiFi status:', error);
            setWifiEnabled(false);
        }
    };

    const handleClose = () => {
        navigate(ROUTES.HOME);
    };

    const handleWifiToggle = async () => {
        const newState = !wifiEnabled;
        setWifiEnabled(newState);
        
        try {
            if (newState) {
                console.log('WiFi enabled - would connect to network');
            } else {
                await wifiService.disconnect();
                console.log('WiFi disabled');
            }
        } catch (error) {
            console.error('Error toggling WiFi:', error);
            setWifiEnabled(!newState); // Revert on error
        }
    };

    const handleHelp = () => {
        console.log('Help clicked - TODO: Implement help screen');
        // TODO: Navigate to help documentation
    };

    const handleSystemStatus = () => {
        console.log('System status clicked');
        // Refresh system data
        loadSystemData();
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