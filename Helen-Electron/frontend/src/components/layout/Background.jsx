import React from 'react';
import { useTheme } from '../../contexts/theme/themeHooks';
import './Background.css';

/**
 * background: gradient background based on selected theme
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