/**
 * Theme Context Hook: Extracted from ThemeContext to satisfy react-refresh/only-export-components
 */
import { useContext } from 'react';
import { ThemeContext } from './themeContexts';

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
