import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { storage } from '../utils/storage';
import { authService } from '../services/authService';
import { TOKEN_KEY, USER_KEY } from '../constants/config';
import { registerForPushNotifications, unregisterPushToken } from '../services/notificationService';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!token && !!user;

    // Check authentication on app start
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const storedToken = await storage.getItem(TOKEN_KEY);
            const storedUser = await storage.getObject<User>(USER_KEY);

            if (storedToken && storedUser) {
                // Verify token is still valid by fetching profile
                try {
                    setToken(storedToken);
                    const freshUser = await authService.getProfile();
                    setUser(freshUser);
                    await storage.setObject(USER_KEY, freshUser);
                } catch (error) {
                    // Token expired or invalid
                    await logout();
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
            await logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<void> => {
        const response = await authService.login({ email, password });

        // Handle nested data structure from backend
        const token = response.data?.token || response.token;
        const user = response.data?.user || response.user;

        if (response.success && token && user) {
            // Restrict login to employee and hr roles — admin and developer must use the web portal
            const restrictedRoles = ['admin', 'developer'];
            if (restrictedRoles.includes(user.role)) {
                const roleLabels: Record<string, string> = {
                    admin: 'Administrator',
                    developer: 'Developer',
                };
                const roleLabel = roleLabels[user.role] || user.role;
                throw new Error(
                    `ACCESS_DENIED:${roleLabel}`
                );
            }

            await storage.setItem(TOKEN_KEY, token);
            await storage.setObject(USER_KEY, user);
            setToken(token);
            setUser(user);

            // Register for push notifications (non-blocking)
            registerForPushNotifications().catch(() => {});
        } else {
            throw new Error('Login failed');
        }
    };

    const logout = async (): Promise<void> => {
        // Unregister push token before clearing auth (non-blocking)
        unregisterPushToken().catch(() => {});
        await storage.removeItem(TOKEN_KEY);
        await storage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated,
                isLoading,
                login,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
