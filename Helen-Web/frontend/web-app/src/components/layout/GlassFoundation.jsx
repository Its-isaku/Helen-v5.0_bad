import React from 'react';
import { useCamera } from '../../contexts/cameraHooks';
import './GlassFoundation.css';

/**
 * GlassFoundation Component
 *
 * Centralized layout container for all UI components, featuring an integrated camera feedback glow effect when the camera is active.
 *
 * @param {React.ReactNode} children - Screen content
 * @param {React.ReactNode} cameraFeedback - Optional CameraFeedback component
 */
export const GlassFoundation = ({ children, cameraFeedback = null }) => {
    const { isCameraActive } = useCamera();

    return (
        <div className={`glass-foundation ${isCameraActive ? 'glass-foundation--camera-active' : ''}`}>
            <div className="glass-foundation__content">
                {children}
            </div>
            {cameraFeedback}
        </div>
    );
};
