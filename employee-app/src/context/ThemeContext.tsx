import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { ThemeColors, ThemeMode } from '../constants/themeTypes';
import { lightColors } from '../constants/lightTheme';
import { darkColors } from '../constants/darkTheme';
import { storage } from '../utils/storage';

const THEME_STORAGE_KEY = '@identix_theme_mode';

interface ThemeContextType {
    colors: ThemeColors;
    mode: ThemeMode;
    isDark: boolean;
    isReady: boolean;
    setMode: (mode: ThemeMode) => void;
    cycleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [isReady, setIsReady] = useState(false);

    // Load saved theme preference on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedMode = await storage.getItem(THEME_STORAGE_KEY);
                if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
                    setModeState(savedMode as ThemeMode);
                }
            } catch (error) {
                console.warn('Failed to load theme preference:', error);
            } finally {
                setIsReady(true);
            }
        };
        loadTheme();
    }, []);

    const setMode = useCallback(async (newMode: ThemeMode) => {
        setModeState(newMode);
        try {
            await storage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }, []);

    // Cycle through: light → dark → system → light …
    const cycleMode = useCallback(() => {
        setModeState((prev) => {
            const next: ThemeMode = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
            storage.setItem(THEME_STORAGE_KEY, next).catch(() => { });
            return next;
        });
    }, []);

    const isDark = useMemo(() => {
        if (mode === 'system') {
            // useColorScheme() can return null on some Android devices — default to light
            return (systemColorScheme ?? 'light') === 'dark';
        }
        return mode === 'dark';
    }, [mode, systemColorScheme]);

    const colors = useMemo(() => {
        return isDark ? darkColors : lightColors;
    }, [isDark]);

    const value = useMemo(
        () => ({ colors, mode, isDark, isReady, setMode, cycleMode }),
        [colors, mode, isDark, isReady, setMode, cycleMode]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

