import React from 'react';
import { useCamera } from '../../contexts/camera/cameraHooks';
import { CIRCLE_STATES } from '../../config/constants';
import './CentralCircle.css';

/**
 * central circle (helen orb): static orb that glows when camera detection is active
 * no animations or size changes - only glow effect
 * Memoized to prevent unnecessary re-renders
 */
export const CentralCircle = React.memo(() => {
    const { isCameraActive, isDetecting } = useCamera();

    const state = isDetecting ? CIRCLE_STATES.ACTIVE : CIRCLE_STATES.IDLE;

    return (
        <div className='central-circle-container'>
            <div
                className={`central-circle central-circle--${state}`}
                aria-live="polite"
                aria-label={isDetecting ? 'Sign detected' : isCameraActive ? 'Camera active' : 'Camera inactive'}
            >
            </div>
        </div>
    );
});