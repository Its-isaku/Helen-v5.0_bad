/**
 * Camera Context Hooks: Extracted from CameraContext to satisfy react-refresh/only-export-components
 */
import { useContext } from 'react';
import { CameraStateContext, CameraActionsContext } from './cameraContexts';

// Hooks for fine-grained consumption
export const useCameraState = () => {
    const ctx = useContext(CameraStateContext);
    if (!ctx) throw new Error('useCameraState debe usarse dentro de un CameraProvider');
    return ctx;
};

export const useCameraActions = () => {
    const ctx = useContext(CameraActionsContext);
    if (!ctx) throw new Error('useCameraActions debe usarse dentro de un CameraProvider');
    return ctx;
};

// Backward-compatible combined hook
export const useCamera = () => {
    const state = useCameraState();
    const actions = useCameraActions();
    return { ...state, ...actions };
};
