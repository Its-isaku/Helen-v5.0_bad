import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/glass/GlassCard';
import { useCamera } from '../contexts/cameraHooks';
import { ROUTES } from '../config/constants';
import './LockScreen.css';

/**
 * LockScreen
 * Visual lock screen with big time, date, camera mode toggle and swipe hint
 * Camera is OFF by default on lock screen (security measure)
 * User can toggle between gesture mode (camera ON) and touch mode (camera OFF)
 * The chosen mode persists when unlocking
 */
// Self-contained clock to avoid parent re-renders
const Clock = React.memo(function Clock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const formatted = useMemo(() => {
        const hours24 = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const hours12 = ((hours24 + 11) % 12) + 1; // 1-12
        const period = hours24 >= 12 ? 'pm' : 'am';
        return {
            timeMain: `${hours12}:${minutes}`,
            period,
            date: now.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })
        };
    }, [now]);

    return (
        <>
            {/* Date above Time */}
            <div className="lock-screen__date" aria-label="Fecha actual">
                {formatted.date}
            </div>
            <div className="lock-screen__time" aria-label="Hora actual">
                <span className="lock-screen__time-main">{formatted.timeMain}</span>
                <span className="lock-screen__ampm">{formatted.period}</span>
            </div>
        </>
    );
});

const LockScreen = () => {
    const navigate = useNavigate();
    const { cameraMode, toggleCamera, handleLockScreen, handleUnlockScreen } = useCamera();

    // On entering the lock screen - disable camera for security
    useEffect(() => {
        const lockCamera = async () => {
            await handleLockScreen();
        };
        lockCamera();
    }, [handleLockScreen]);

    const handleUnlock = () => {
        // Restore camera state based on user's chosen mode
        handleUnlockScreen();
        navigate(ROUTES.HOME);
    };

    // Handle camera toggle - also unlocks Helen
    const handleCameraToggle = () => {
        toggleCamera();
        // Unlock Helen when camera is toggled
        handleUnlock();
    };

    // Pointer/mouse/touch swipe-up support on the swipe hint
    const swipeRef = useRef(null);
    const swipeState = useRef({ startY: null, active: false });

    const onPointerDown = (e) => {
        swipeState.current.startY = e.clientY ?? (e.touches?.[0]?.clientY || 0);
        swipeState.current.active = true;
    };

    const onPointerMove = (e) => {
        if (!swipeState.current.active) return;
        const currentY = e.clientY ?? (e.touches?.[0]?.clientY || 0);
        const delta = swipeState.current.startY - currentY; // positive when moving up
        if (delta > 60) {
            swipeState.current.active = false;
            handleUnlock();
        }
    };

    const onPointerUp = () => {
        swipeState.current.active = false;
        swipeState.current.startY = null;
    };

    const onWheel = (e) => {
        // Scroll up with mouse wheel to unlock
        if (e.deltaY < -60) {
            handleUnlock();
        }
    };

    return (
        <div className="lock-screen">
            {/* Corner quick action - Toggle between gesture and touch mode */}
            <div className="lock-screen__corner-actions">
                <GlassCard
                    hoverable
                    onClick={handleCameraToggle}
                    ariaLabel={cameraMode === 'gesture' ? 'Cambiar a modo táctil' : 'Cambiar a modo gestos'}
                    className="lock-screen__quick-action"
                >
                    <div className="lock-screen__quick-action-icon">
                        <span className="material-icons-outlined">
                            {cameraMode === 'gesture' ? 'videocam' : 'videocam_off'}
                        </span>
                    </div>
                </GlassCard>
            </div>

            <div className="lock-screen__content" role="button" onDoubleClick={handleUnlock}>
                <Clock />
            </div>

            <div
                className="lock-screen__swipe"
                ref={swipeRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
            >
                <span 
                    className="material-icons-outlined lock-screen__swipe-arrow"
                    onClick={handleUnlock}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleUnlock();
                        }
                    }}
                    aria-label="Desbloquear"
                    style={{ cursor: 'pointer' }}
                >
                    expand_less
                </span>
                <span className="lock-screen__swipe-text">Desliza hacia arriba para desbloquear</span>
            </div>
        </div>
    );
};

export default LockScreen;