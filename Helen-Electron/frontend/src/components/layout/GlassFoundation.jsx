import React from 'react';
import { useCamera } from '../../contexts/camera/cameraHooks';
import './GlassFoundation.css';

/**
 * Glass Foundation: centralized layout container that holds all UI components
 * Now with integrated camera feedback glow effect
 * 
 * @param {React.ReactNode} children - Screen content
 * @param {React.ReactNode} cameraFeedback - CameraFeedback component (optional)
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
