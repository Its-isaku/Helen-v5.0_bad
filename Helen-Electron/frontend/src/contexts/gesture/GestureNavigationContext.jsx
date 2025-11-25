import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GESTURE_ACTIONS, HOME_ACTION_TYPES, ROUTES } from '../../config/constants';
import { GestureNavigationStateContext, GestureNavigationActionsContext } from './gestureNavigationContexts';

/**
 * Gesture Navigation Provider
 * Listens to prediction:result IPC events from Main Process
 * Executes appropriate action (navigate/modal/action) based on gesture
 * Follows same pattern as CameraContext for consistency
 * 
 * Architecture:
 * - Main Process (predictionService) sends IPC event with gesture
 * - This context listens and dispatches appropriate UI action
 * - Navigation: Direct route change via React Router
 * - Modals: Sets pending state, consumed by HomeScreen
 * - Actions: Context-dependent, consumed by individual screens
 */
export const GestureNavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [lastGesture, setLastGesture] = useState(null);
  const [pendingModalGesture, setPendingModalGesture] = useState(null);

  /**
   * Execute gesture action based on type
   * Optimized with stable refs to prevent unnecessary recreations
   */
  const locationRef = useRef(location);
  const navigateRef = useRef(navigate);
  
  useEffect(() => {
    locationRef.current = location;
    navigateRef.current = navigate;
  }, [location, navigate]);
  
  const executeGestureAction = useCallback((gesture, confidence) => {
    console.log(`Executing gesture: ${gesture} (confidence: ${confidence})`);
    
    const action = GESTURE_ACTIONS[gesture];
    
    if (!action) {
      console.warn(`Unknown gesture: ${gesture}`);
      return;
    }

    setLastGesture({ gesture, confidence, timestamp: Date.now() });

    // Execute based on action type
    switch (action.type) {
      case HOME_ACTION_TYPES.NAVIGATE:
        console.log(`Navigating to: ${action.route}`);
        navigateRef.current(action.route);
        break;

      case HOME_ACTION_TYPES.MODAL:
        console.log(`Opening modal: ${action.modal}`);
        // Store modal request - will be picked up by HomeScreen component
        setPendingModalGesture({ modal: action.modal, timestamp: Date.now() });
        // Navigate to HOME if not already there (modals only work on HomeScreen)
        if (locationRef.current.pathname !== ROUTES.HOME) {
          navigateRef.current(ROUTES.HOME);
        }
        break;

      case 'action':
        console.log(`Executing action: ${action.action}`);
        
        // Validate context for agregar/editar actions
        if (action.action === 'add-item' || action.action === 'edit-item') {
          // Only allow on Alarms and Devices screens
          const validRoutes = [ROUTES.ALARMS, ROUTES.DEVICES];
          
          if (!validRoutes.includes(locationRef.current.pathname)) {
            console.warn(`Action ${action.action} not valid on route: ${locationRef.current.pathname}`);
            console.log(`Navigate to Alarms or Devices first to use this gesture`);
            return; // Don't set pendingModalGesture
          }
          
          console.log(`Action ${action.action} valid on route: ${locationRef.current.pathname}`);
        }
        
        // Context-dependent actions handled by screen components
        setPendingModalGesture({ action: action.action, timestamp: Date.now() });
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }, []); // Empty deps - using refs instead

  /**
   * Clear pending modal gesture (called by screens after consuming)
   */
  const clearPendingModal = useCallback(() => {
    setPendingModalGesture(null);
  }, []);

  /**
   * Listen to IPC prediction:result events from Main Process
   */
  useEffect(() => {
    if (!window.electronBackend) {
      console.warn('Electron backend not available - gesture navigation disabled');
      return;
    }

    const handlePredictionResult = (event) => {
      const { gesture, confidence } = event;
      console.log(`Received prediction from Main Process: ${gesture} (${confidence})`);
      
      // Only execute high-confidence predictions (>= 70%)
      if (confidence >= 0.7) {
        executeGestureAction(gesture, confidence);
      } else {
        console.log(`Low confidence (${confidence}), ignoring gesture`);
      }
    };

    // Subscribe to prediction results
    window.electronBackend.on('prediction:result', handlePredictionResult);
    console.log('Subscribed to prediction:result events');

    // Cleanup
    return () => {
      console.log('Unsubscribing from prediction:result events');
      // Note: Electron's removeListener would go here if exposed in preload
    };
  }, [executeGestureAction]);

  // Memoize context values to prevent unnecessary re-renders
  const state = useMemo(() => ({
    lastGesture,
    pendingModalGesture,
  }), [lastGesture, pendingModalGesture]);

  const actions = useMemo(() => ({
    executeGestureAction,
    clearPendingModal,
  }), [executeGestureAction, clearPendingModal]);

  return (
    <GestureNavigationActionsContext.Provider value={actions}>
      <GestureNavigationStateContext.Provider value={state}>
        {children}
      </GestureNavigationStateContext.Provider>
    </GestureNavigationActionsContext.Provider>
  );
};
