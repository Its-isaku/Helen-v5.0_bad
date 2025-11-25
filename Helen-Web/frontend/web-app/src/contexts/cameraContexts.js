/**
 * Camera Context Definitions
 * Separate file for contexts to satisfy react-refresh/only-export-components
 */
import { createContext } from 'react';

// Split contexts to minimize re-renders in consumers that only need actions
export const CameraStateContext = createContext(null);
export const CameraActionsContext = createContext(null);
