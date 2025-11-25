import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { THEMES } from '../config/constants';
import { ThemeContext } from './themeContexts';

/**
 * ThemeProvider Component
 *
 * Manages application theme state with backend persistence.
 * Optimized with useMemo and useCallback to prevent unnecessary re-renders.
 */

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(THEMES.OCEAN);
    const [isLoading, setIsLoading] = useState(true);

    // Memoize available themes (these never change)
    const availableThemes = useMemo(() => Object.values(THEMES), []);

    // Load theme from backend (localStorage) on mount
    useEffect(() => {
        const loadThemeFromBackend = async () => {
            try {
                // Backend integration point
                const savedThemeId = localStorage.getItem('theme') || 'ocean';
                const theme = availableThemes.find(t => t.id === savedThemeId) || THEMES.OCEAN;
                setCurrentTheme(theme);
            } catch (error) {
                // Log error if theme fails to load
                console.error('Error loading theme:', error);
                setCurrentTheme(THEMES.OCEAN);
            } finally {
                setIsLoading(false);
            }
        };
        loadThemeFromBackend();
    }, [availableThemes]);

    // Memoize changeTheme function to prevent recreation on every render
    const changeTheme = useCallback(async (themeId) => {
        const newTheme = availableThemes.find(t => t.id === themeId);
        if (!newTheme) return;

        try {
            // Backend integration point
            localStorage.setItem('theme', themeId);
            setCurrentTheme(newTheme);
        } catch (error) {
            // Log error if theme fails to save
            console.error('Error saving theme:', error);
        }
    }, [availableThemes]);

    // Memoize context value to prevent re-renders when values have not changed
    const value = useMemo(() => ({
        currentTheme,
        availableThemes,
        changeTheme,
        isLoading,
    }), [currentTheme, availableThemes, changeTheme, isLoading]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
