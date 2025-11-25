import { createContext } from 'react';

/**
 * Gesture Navigation Contexts
 * Separate state and actions for optimal re-render performance
 * Follows same pattern as CameraContext and ThemeContext
 */

export const GestureNavigationStateContext = createContext(null);
export const GestureNavigationActionsContext = createContext(null);
