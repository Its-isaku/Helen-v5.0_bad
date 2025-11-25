import { useContext } from 'react';
import { GestureNavigationStateContext, GestureNavigationActionsContext } from './gestureNavigationContexts';

/**
 * Gesture Navigation Hooks
 * Provides convenient access to gesture navigation state and actions
 * Follows same pattern as useCamera() and useTheme()
 */

/**
 * Hook to access gesture navigation state
 */
export const useGestureNavigationState = () => {
  const context = useContext(GestureNavigationStateContext);
  if (!context) {
    throw new Error('useGestureNavigationState must be used within GestureNavigationProvider');
  }
  return context;
};

/**
 * Hook to access gesture navigation actions
 */
export const useGestureNavigationActions = () => {
  const context = useContext(GestureNavigationActionsContext);
  if (!context) {
    throw new Error('useGestureNavigationActions must be used within GestureNavigationProvider');
  }
  return context;
};

/**
 * Convenience hook for full access to state and actions
 * Use this in most cases for simplicity
 */
export const useGestureNavigation = () => {
  const state = useGestureNavigationState();
  const actions = useGestureNavigationActions();
  return { ...state, ...actions };
};
