import React from 'react';
import { useTheme } from '../../contexts/themeHooks';
import './Background.css';

/**
 * Background Component
 *
 * Renders a gradient background based on the currently selected theme.
 */
export const Background = () => {
    const { currentTheme } = useTheme();

    return (
        <div
            className='background'
            style={{
                background: currentTheme.backgroundColor
            }}
        >
        </div>
    );
};