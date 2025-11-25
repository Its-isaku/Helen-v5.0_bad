import React, { useEffect } from 'react';
import { useCamera } from '../../contexts/camera/cameraHooks';
import { useTheme } from '../../contexts/theme/themeHooks';
import './CameraFeedback.css';

/**
 * Camera Feedback (Refactored)
 * Visual feedback for sign language detection with multiple rendering modes
 * 
 * Modes:
 * - "badge" (deprecated): Old purple badge in top-right corner
 * - "glow": Adds subtle glowing border effect (for screens)
 * - "hidden": No visual feedback (for HomeScreen)
 * 
 * @param {string} mode - Rendering mode
 * @param {string} screenName - Name of current screen (for "Última" label)
 * @param {boolean} showLastVisited - Show "Última: [screen]" label
 */
export const CameraFeedback = ({ 
    mode = 'glow',
    screenName = null,
    showLastVisited = true
}) => {
    const { isCameraActive, lastDetection, isDetecting, subscribeToCameraEvents } = useCamera();
    const { currentTheme } = useTheme();

    // Subscribe to camera detection events
    useEffect(() => {
        if (!isCameraActive) return;

        let unsubscribe = null;

        const subscribe = async () => {
            unsubscribe = await subscribeToCameraEvents((detection) => {
                console.log('Sign detected:', detection);
            });
        };

        subscribe();

        return () => {
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [isCameraActive, subscribeToCameraEvents]);

    // Hidden mode - no rendering
    if (mode === 'hidden') {
        return null;
    }

    // If camera is not active, don't render anything
    if (!isCameraActive) {
        return null;
    }

    // Get theme-specific glow color
    const getGlowColor = () => {
        // Extract a bright accent color from the theme
        const themeColors = {
            midnight: '#8B8B8B',     // Light gray
            ocean: '#4B8FFF',        // Bright blue
            violet: '#9D6BD9',       // Bright purple
            pink: '#FF4DCF',         // Bright pink
            abismo: '#5B6BFF',       // Bright blue-purple
            cosmos: '#8B4DFF',       // Bright purple
        };
        return themeColors[currentTheme.id] || '#4B8FFF';
    };

    const glowColor = getGlowColor();

    // Glow mode - renders glow effect wrapper
    if (mode === 'glow') {
        return (
            <>
                {/* CSS-only glow effect applied via class on parent */}
                <style>
                    {`
                        .glass-foundation--camera-active {
                            border-color: ${glowColor} !important;
                            box-shadow: 
                                0 0 15px ${glowColor},
                                0 0 30px ${glowColor}40,
                                inset 0 0 15px rgba(255, 255, 255, 0.05);
                            animation: cameraGlowPulse 2s ease-in-out infinite;
                        }
                        
                        @keyframes cameraGlowPulse {
                            0%, 100% { 
                                box-shadow: 
                                    0 0 15px ${glowColor},
                                    0 0 30px ${glowColor}40,
                                    inset 0 0 15px rgba(255, 255, 255, 0.05);
                            }
                            50% { 
                                box-shadow: 
                                    0 0 20px ${glowColor},
                                    0 0 40px ${glowColor}60,
                                    inset 0 0 20px rgba(255, 255, 255, 0.08);
                            }
                        }
                    `}
                </style>
                
                {/* Last Visited Label */}
                {showLastVisited && screenName && (
                    <div className="camera-feedback__last-visited">
                        <span className="camera-feedback__last-visited-text">
                            Última: {screenName}
                        </span>
                    </div>
                )}
            </>
        );
    }

    // Badge mode (deprecated - old design, kept for backward compatibility)
    if (mode === 'badge') {
        return (
            <div className="camera-feedback">
                <div className="camera-feedback__status">
                    <div className={`camera-feedback__indicator ${isDetecting ? 'camera-feedback__indicator--active' : ''}`} />
                    <span className="camera-feedback__text">
                        {isDetecting ? 'Detecting...' : 'Camera Active'}
                    </span>
                </div>

                {lastDetection && (
                    <div className="camera-feedback__detection">
                        <span className="camera-feedback__gesture">
                            Last: {lastDetection.gesture}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return null;
};