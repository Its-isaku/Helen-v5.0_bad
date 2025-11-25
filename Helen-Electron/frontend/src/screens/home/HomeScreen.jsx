import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/theme/themeHooks';
import { useCamera } from '../../contexts/camera/cameraHooks';
import { useGestureNavigation } from '../../contexts/gesture/gestureNavigationHooks';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassModal } from '../../components/glass/GlassModal';
import { GlassButton } from '../../components/glass/GlassButton';
import { CentralCircle } from '../../components/input/CentralCircle';
import { WiFiConnection } from '../../components/wifi/WiFiConnection';
import { TimeDisplay } from '../../components/common/TimeDisplay';
import { HOME_ACTIONS, HOME_ACTION_TYPES } from '../../config/constants';
import './HomeScreen.css';

const HomeScreen = () => {
    const navigate = useNavigate();
    const { availableThemes, currentTheme, changeTheme } = useTheme();
    const { cameraMode, toggleCamera } = useCamera();
    const { pendingModalGesture, clearPendingModal } = useGestureNavigation();
    
    // Local modal state
    const [activeModal, setActiveModal] = useState(null);
    
    // Time is rendered via isolated TimeDisplay components to avoid parent re-renders

    // Handle gesture-triggered modals and actions
    useEffect(() => {
        if (pendingModalGesture) {
            if (pendingModalGesture.modal) {
                console.log(`Opening modal from gesture: ${pendingModalGesture.modal}`);
                setActiveModal(pendingModalGesture.modal);
                clearPendingModal();
            } else if (pendingModalGesture.action === 'toggle-camera') {
                console.log('Toggling camera from gesture');
                toggleCamera();
                clearPendingModal();
            }
        }
    }, [pendingModalGesture, clearPendingModal, toggleCamera]);

    // Memoized callbacks to prevent function recreation on every render
    const handleGridItemClick = useCallback((action) => {
        if (action.type === HOME_ACTION_TYPES.NAVIGATE) {
            navigate(action.route);
        } else if (action.type === HOME_ACTION_TYPES.MODAL) {
            setActiveModal(action.modal);
        }
    }, [navigate]);

    const closeModal = useCallback(() => setActiveModal(null), []);

    // Memoized theme change handler
    const handleThemeChange = useCallback((themeId) => {
        changeTheme(themeId);
        closeModal();
    }, [changeTheme, closeModal]);

    return (
        <div className="home-screen">
        {/* Central Circle - Absolutely Centered, Overlaps Everything */}
        <div className="home-screen__circle-container">
            <CentralCircle />
        </div>

        {/* TOP SECTION */}
        <div className="home-screen__top-section">
            {/* Weather Card - Left */}
            <GlassCard 
                hoverable
                onClick={() => handleGridItemClick(HOME_ACTIONS.WEATHER)}
                className="home-screen__card home-screen__card--weather"
                ariaLabel="Navigate to Weather"
            >
                <div className="home-screen__card-icon">
                    <span className="material-symbols-outlined md-99">partly_cloudy_day</span>
                </div>
                <h3 className="home-screen__card-title">Clima</h3>
            </GlassCard>

            {/* Date Card - Center */}
            <GlassCard className="home-screen__card home-screen__card--date">
                <p className="home-screen__date-day">
                    <TimeDisplay format="day" />
                </p>
                <h2 className="home-screen__date-full">
                    <TimeDisplay format="date" />
                </h2>
            </GlassCard>

            {/* Settings Card - Right */}
            <GlassCard 
                hoverable
                onClick={() => handleGridItemClick(HOME_ACTIONS.SETTINGS)}
                className="home-screen__card home-screen__card--settings"
                ariaLabel="Navigate to Settings"
            >
                <div className="home-screen__card-icon">
                    <span className="material-icons-outlined md-99">settings</span>
                </div>
                <h3 className="home-screen__card-title">Ajustes</h3>
            </GlassCard>

            {/* Small Shortcut Buttons - Right Side */}
            <div className="home-screen__shortcuts">
                <GlassCard 
                    hoverable
                    onClick={() => handleGridItemClick(HOME_ACTIONS.WIFI)}
                    className="home-screen__card home-screen__card--shortcut"
                    ariaLabel="Open WiFi Settings"
                >
                    <div className="home-screen__card-icon home-screen__card-icon--small">
                        <span className="material-icons-outlined">wifi</span>
                    </div>
                </GlassCard>

                <GlassCard 
                    hoverable
                    onClick={toggleCamera}
                    className="home-screen__card home-screen__card--shortcut"
                    ariaLabel={cameraMode === 'gesture' ? "Cambiar a modo táctil" : "Cambiar a modo gestos"}
                >
                    <div className="home-screen__card-icon home-screen__card-icon--small">
                        <span className="material-icons-outlined">
                            {cameraMode === 'gesture' ? 'videocam' : 'videocam_off'}
                        </span>
                    </div>
                </GlassCard>

                <GlassCard 
                    hoverable
                    onClick={() => handleGridItemClick(HOME_ACTIONS.THEME)}
                    className="home-screen__card home-screen__card--shortcut"
                    ariaLabel="Change Theme"
                >
                    <div className="home-screen__card-icon home-screen__card-icon--small">
                        <span className="material-icons-outlined">palette</span>
                    </div>
                </GlassCard>
            </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="home-screen__bottom-section">
            {/* Devices Card - Left */}
            <GlassCard 
                hoverable
                onClick={() => handleGridItemClick(HOME_ACTIONS.DEVICES)}
                className="home-screen__card home-screen__card--devices"
                ariaLabel="Navigate to My Devices"
            >
                <div className="home-screen__card-icon">
                    <span className="material-symbols-outlined md-99">light_group</span>
                </div>
                <h3 className="home-screen__card-title">Dispositivos</h3>
            </GlassCard>

            {/* Time Card - Center (Circle overlaps from above) */}
            <GlassCard className="home-screen__card home-screen__card--time">
                <h2 className="home-screen__time">
                    <TimeDisplay format="time" />
                </h2>
            </GlassCard>

            {/* Alarms Card - Right */}
            <GlassCard 
                hoverable
                onClick={() => handleGridItemClick(HOME_ACTIONS.ALARMS)}
                className="home-screen__card home-screen__card--alarms"
                ariaLabel="Navigate to Alarms"
            >
                <div className="home-screen__card-icon">
                    <span className="material-icons-outlined md-99">alarm</span>
                </div>
                <h3 className="home-screen__card-title">Alarmas</h3>
            </GlassCard>
        </div>

        {/* WiFi Modal */}
        <GlassModal
            isOpen={activeModal === 'wifi'}
            onClose={closeModal}
            title="Configuración WiFi"
            size="large"
        >
            <WiFiConnection onClose={closeModal} />
        </GlassModal>

        {/* Theme Modal */}
        <GlassModal
            isOpen={activeModal === 'theme'}
            onClose={closeModal}
            title="Seleccionar Tema"
            size="medium"
        >
            <div className="theme-modal-grid">
                {availableThemes.map((theme) => (
                    <GlassCard
                        key={theme.id}
                        hoverable
                        onClick={() => handleThemeChange(theme.id)}
                        className={currentTheme.id === theme.id ? 'theme-modal-grid__item--active' : ''}
                    >
                        <div
                            className="theme-modal-grid__preview"
                            style={{
                                background: theme.backgroundColor,
                                border: currentTheme.id === theme.id ? '2px solid var(--color-icon)' : '1px solid rgba(255,255,255,0.10)'
                            }}
                        />
                        <p style={{ margin: 0, textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>{theme.name}</p>
                    </GlassCard>
                ))}
            </div>
        </GlassModal>
        </div>
    );
};

export default HomeScreen;