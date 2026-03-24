import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage utility functions for AsyncStorage
 */

export const storage = {
    /**
     * Store a string value
     */
    async setItem(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error('Error storing data:', error);
            throw error;
        }
    },

    /**
     * Get a string value
     */
    async getItem(key: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error('Error retrieving data:', error);
            return null;
        }
    },

    /**
     * Store an object (JSON stringify)
     */
    async setObject<T>(key: string, value: T): Promise<void> {
        try {
            if (value === null || value === undefined) {
                await AsyncStorage.removeItem(key);
                return;
            }
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
        } catch (error) {
            console.error('Error storing object:', error);
            throw error;
        }
    },

    /**
     * Get an object (JSON parse)
     */
    async getObject<T>(key: string): Promise<T | null> {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue ? JSON.parse(jsonValue) : null;
        } catch (error) {
            console.error('Error retrieving object:', error);
            return null;
        }
    },

    /**
     * Remove an item
     */
    async removeItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing data:', error);
            throw error;
        }
    },

    /**
     * Clear all storage
     */
    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
            throw error;
        }
    },
};
