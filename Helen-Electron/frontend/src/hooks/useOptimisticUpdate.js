/**
 * useOptimisticUpdate Hook
 * Provides optimistic update pattern with automatic rollback on error
 * Eliminates duplication in Alarms and MyDevices screens
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for optimistic updates with rollback
 * @param {Function} apiCall - Async function to call API
 * @param {Function} onError - Error handler callback
 * @returns {{ execute, isLoading, error }}
 */
export function useOptimisticUpdate(apiCall, onError) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const snapshotRef = useRef(null);
    
    const execute = useCallback(async (optimisticUpdate, rollback) => {
        setIsLoading(true);
        setError(null);
        
        // Store snapshot for rollback
        snapshotRef.current = rollback;
        
        try {
        // Apply optimistic update immediately
        optimisticUpdate();
        
        // Execute API call
        const result = await apiCall();
        
        return result;
        } catch (err) {
        console.error('Optimistic update failed:', err);
        
        // Rollback on error
        if (snapshotRef.current) {
            snapshotRef.current();
        }
        
        setError(err.message || 'Operation failed');
        
        if (onError) {
            onError(err);
        }
        
        throw err;
        } finally {
        setIsLoading(false);
        snapshotRef.current = null;
        }
    }, [apiCall, onError]);
    
    // Cleanup
    useEffect(() => {
        return () => {
        snapshotRef.current = null;
        };
    }, []);
    
    return { execute, isLoading, error };
}
