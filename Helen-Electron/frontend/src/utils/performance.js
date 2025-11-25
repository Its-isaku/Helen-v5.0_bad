/**
 * Performance Monitoring Utilities
 * Development helpers for tracking component re-renders and performance metrics
 * 
 * Usage:
 * import { useRenderCount, logComponentRender } from './utils/performance';
 * 
 * // In a component:
 * const renderCount = useRenderCount('ComponentName');
 */

import { useEffect, useRef } from 'react';

// Compile-time dev flag (set via Vite define). Falls back to import.meta.env.DEV in dev server.
// The static __DEV__ makes it easy for terser to drop dev-only branches entirely in production.
// eslint-disable-next-line no-undef
const DEV = (typeof __DEV__ !== 'undefined' ? __DEV__ : import.meta.env.DEV) === true;

// Tiny helpers for no-op exports in production
const noop = () => {};
const returnZero = () => 0;

/**
 * Hook to track and log component render count
 * Only active in development mode
 * 
 * @param {string} componentName - Name of the component being tracked
 * @returns {number} Current render count
 * 
 * @example
 * const HomeScreen = () => {
 *   const renderCount = useRenderCount('HomeScreen');
 *   // Component logic...
 * }
 */
export const useRenderCount = DEV
    ? (componentName) => {
            const renderCount = useRef(0);
            useEffect(() => {
                renderCount.current += 1;
                if (DEV) {
                    console.log(
                        `%c[Render] ${componentName} - Count: ${renderCount.current}`,
                        'color: #4CAF50; font-weight: bold;'
                    );
                }
            });
            return renderCount.current;
        }
    : returnZero;

/**
 * Hook to track why a component re-rendered
 * Logs which props/state changed between renders
 * 
 * @param {string} componentName - Name of the component
 * @param {Object} props - Component props to track
 * 
 * @example
 * const MyComponent = (props) => {
 *   useWhyDidYouUpdate('MyComponent', props);
 *   // Component logic...
 * }
 */
export const useWhyDidYouUpdate = DEV
    ? (componentName, props) => {
            const previousProps = useRef();
            useEffect(() => {
                if (DEV && previousProps.current) {
                    const allKeys = Object.keys({ ...previousProps.current, ...props });
                    const changedProps = {};
                    allKeys.forEach((key) => {
                        if (previousProps.current[key] !== props[key]) {
                            changedProps[key] = {
                                from: previousProps.current[key],
                                to: props[key],
                            };
                        }
                    });
                    if (Object.keys(changedProps).length > 0) {
                        console.log(
                            `%c[Why Update] ${componentName}`,
                            'color: #FF9800; font-weight: bold;',
                            changedProps
                        );
                    }
                }
                previousProps.current = props;
            });
        }
    : noop;

/**
 * Measure component mount/unmount time
 * 
 * @param {string} componentName - Name of the component
 * 
 * @example
 * const MyComponent = () => {
 *   useMountTime('MyComponent');
 *   // Component logic...
 * }
 */
export const useMountTime = DEV
    ? (componentName) => {
            useEffect(() => {
                const startTime = performance.now();
                if (DEV) {
                    console.log(
                        `%c[Mount] ${componentName} - Started`,
                        'color: #2196F3; font-weight: bold;'
                    );
                }
                return () => {
                    const endTime = performance.now();
                    const mountDuration = endTime - startTime;
                    if (DEV) {
                        console.log(
                            `%c[Unmount] ${componentName} - Duration: ${mountDuration.toFixed(2)}ms`,
                            'color: #F44336; font-weight: bold;'
                        );
                    }
                };
            }, [componentName]);
        }
    : noop;

/**
 * Log component render with custom styling
 * Simple logging utility for debugging
 * 
 * @param {string} componentName - Name of the component
 * @param {Object} data - Additional data to log
 */
export const logComponentRender = DEV
    ? (componentName, data = {}) => {
            if (DEV) {
                console.log(
                    `%c[Component] ${componentName}`,
                    'color: #9C27B0; font-weight: bold;',
                    data
                );
            }
        }
    : noop;

/**
 * Performance profiler for expensive operations
 * Measures execution time of a function
 * 
 * @param {string} operationName - Name of the operation
 * @param {Function} fn - Function to measure
 * @returns {*} Result of the function
 * 
 * @example
 * const result = profileOperation('Data Processing', () => {
 *   return processLargeDataset(data);
 * });
 */
export const profileOperation = DEV
    ? (operationName, fn) => {
            const startTime = performance.now();
            const result = fn();
            const endTime = performance.now();
            console.log(
                `%c[Profile] ${operationName} - ${(endTime - startTime).toFixed(2)}ms`,
                'color: #00BCD4; font-weight: bold;'
            );
            return result;
        }
    : ((_, fn) => fn());

/**
 * Bundle size impact estimator
 * Logs estimated component size contribution
 * Note: This is approximate and for development reference only
 */
export const estimateBundleImpact = DEV
    ? () => {
            const scripts = document.querySelectorAll('script[src]');
            scripts.forEach((script) => {
                // This is a rough estimate based on script tag presence
                console.log(`Script: ${script.src}`);
            });
            console.log(
                '%c[Bundle] Run "npm run build" and "npm run preview" for accurate bundle analysis',
                'color: #607D8B; font-weight: bold; font-size: 12px;'
            );
        }
    : noop;

/**
 * React DevTools Profiler wrapper
 * Use this to wrap components for React DevTools profiling
 * 
 * @param {string} id - Unique identifier for the profiler
 * @param {Function} onRender - Callback fired on each render
 * @returns {Function} Profiler wrapper component
 * 
 * @example
 * import { Profiler } from 'react';
 * import { createProfilerWrapper } from './utils/performance';
 * 
 * const onRenderCallback = createProfilerCallback('HomeScreen');
 * 
 * <Profiler id="HomeScreen" onRender={onRenderCallback}>
 *   <HomeScreen />
 * </Profiler>
 */
export const createProfilerCallback = DEV
    ? (componentName) => {
            return (id, phase, actualDuration, baseDuration) => {
                if (DEV) {
                    console.log(
                        `%c[Profiler] ${componentName}`,
                        'color: #E91E63; font-weight: bold;',
                        {
                            phase,
                            actualDuration: `${actualDuration.toFixed(2)}ms`,
                            baseDuration: `${baseDuration.toFixed(2)}ms`,
                        }
                    );
                }
            };
        }
    : (() => noop);

/**
 * Memory usage tracker
 * Logs current memory usage (Chrome only)
 */
export const logMemoryUsage = DEV
    ? () => {
            if (performance.memory) {
                const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
                console.log(
                    '%c[Memory]',
                    'color: #795548; font-weight: bold;',
                    {
                        used: `${(usedJSHeapSize / 1048576).toFixed(2)} MB`,
                        total: `${(totalJSHeapSize / 1048576).toFixed(2)} MB`,
                        limit: `${(jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
                    }
                );
            }
        }
    : noop;

/**
 * Export all performance utilities
 */
const devApi = {
    useRenderCount,
    useWhyDidYouUpdate,
    useMountTime,
    logComponentRender,
    profileOperation,
    estimateBundleImpact,
    createProfilerCallback,
    logMemoryUsage,
};

export default devApi;
