import api from './api';
import { LoginCredentials, AuthResponse, User } from '../types';

export const authService = {
    /**
     * Login user with email and password
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    /**
     * Get current user profile
     */
    getProfile: async (): Promise<User> => {
        const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/profile');
        return response.data.data.user;
    },
};
